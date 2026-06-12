import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// Fallback initial products matching mock data
const defaultProducts = [
  { 
    id: 1, 
    name: "M3 MacBook Air Pro", 
    brand: "Apple Inc.", 
    price: 1099.00, 
    availability: "In Stock",
    description: "Some quick example text to build on the card title and make up the bulk of the card's content. Supercharged by the next-generation M3 chip, this system features extreme battery efficiency and an ultra-thin aluminum chassis built for developers working on the move.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60"
  },
  { 
    id: 2, 
    name: "Galaxy S24 Ultra Phone", 
    brand: "Samsung Mobile", 
    price: 1299.99, 
    availability: "Low Stock",
    description: "Experience the pinnacle of mobile hardware integration. This device features an embedded S-Pen, an advanced titanium framing layer, and multi-lens AI processing mechanics designed to capture raw resolution imagery under extreme low-light environments.",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60"
  }
]

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') 
  
  // Separate visibility toggle states for individual fields to prevent cross-triggering
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [currentPage, setCurrentPage] = useState('signup')
  const isRegistrationProcessing = useRef(false)

  // Product Management States
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('storeProducts')
    return saved ? JSON.parse(saved) : defaultProducts
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')

  // Form Fields State snapshots
  const [productId, setProductId] = useState('')
  const [prodName, setProdName] = useState('')
  const [prodBrand, setProdBrand] = useState('')
  const [prodImage, setProdImage] = useState('')
  const [prodDesc, setProdDesc] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodStock, setProdStock] = useState('In Stock')

  // UPDATED: Dynamically synchronizes application view states with the browser tab document title
  useEffect(() => {
    if (currentPage === 'home') {
      document.title = 'Home'
    } else if (currentPage === 'signin') {
      document.title = 'SignIn'
    } else if (currentPage === 'signup') {
      document.title = 'SignUp'
    }
  }, [currentPage])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setCurrentPage('home') 
      } else {
        setUser(null)
        setCurrentPage('signup') 
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isRegistrationProcessing.current) return

      if (session?.user) {
        setUser(session.user)
        setCurrentPage('home')
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async (e, authType) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const cleanEmail = email.trim()
    const cleanPassword = password.trim()

    try {
      if (authType === 'signup') {
        if (cleanPassword !== confirmPassword.trim()) {
          throw new Error("Passwords do not match!")
        }

        isRegistrationProcessing.current = true
        const { error } = await supabase.auth.signUp({ email: cleanEmail, password: cleanPassword })
        
        if (error) {
          isRegistrationProcessing.current = false
          if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
            setMessage({ type: 'error', text: 'User already exists, please sign in.' })
            return
          }
          throw error
        }
        
        await supabase.auth.signOut()
        setUser(null)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setCurrentPage('signin') 
        setMessage({ type: 'success', text: 'Account created successfully! Please sign in.' })

        setTimeout(() => {
          isRegistrationProcessing.current = false
        }, 500)

      } else if (authType === 'signin') {
        const { error, data } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword })
        if (error) throw error
        
        setMessage({ type: 'success', text: 'Logged in successfully!' })
        setUser(data.user)

        setTimeout(() => {
          setCurrentPage('home')
          setMessage({ type: '', text: '' }) 
          setEmail('')
          setPassword('')
        }, 1000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCurrentPage('signup') 
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setMessage({ type: '', text: '' })
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
      if (error) throw error
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    }
  }

  // --- Product Modals logic ---
  const openModal = (mode, id = null) => {
    setModalMode(mode)
    if (mode === 'edit' && id) {
      const prod = products.find(p => p.id === id)
      if (prod) {
        setProductId(prod.id)
        setProdName(prod.name)
        setProdBrand(prod.brand)
        setProdImage(prod.image || '')
        setProdDesc(prod.description || '')
        setProdPrice(prod.price)
        setProdStock(prod.availability)
      }
    } else {
      setProductId('')
      setProdName('')
      setProdBrand('')
      setProdImage('')
      setProdDesc('')
      setProdPrice('')
      setProdStock('In Stock')
    }
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  const handleFormSubmit = (e) => {
    e.preventDefault()
    const priceNum = parseFloat(prodPrice) || 0

    if (productId) {
      setProducts(products.map(p => p.id === productId ? { 
        ...p, name: prodName, brand: prodBrand, image: prodImage.trim(), description: prodDesc.trim(), price: priceNum, availability: prodStock 
      } : p))
    } else {
      const newProduct = {
        id: Date.now(), name: prodName, brand: prodBrand, image: prodImage.trim(), description: prodDesc.trim(), price: priceNum, availability: prodStock
      }
      setProducts([...products, newProduct])
    }
    closeModal()
  }

  const deleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  if (loading && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#1e252b] text-gray-400">
        <p>Loading application...</p>
      </main>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#1e252b] text-gray-200 font-sans">
      {currentPage === 'home' && user ? (
        <div>
          {/* Navbar Component Layout */}
          <nav className="bg-[#181e24] border-b border-gray-800 shadow-md">
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-xl font-bold tracking-tight text-white cursor-pointer">Portal</h1>
              <div className="flex items-center space-x-4">
                <button onClick={() => openModal('add')} className="bg-[#0d6efd] text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-[#0b5ed7] transition-colors">
                  + Add Product
                </button>
                <button onClick={handleSignOut} className="bg-transparent border border-gray-600 text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          </nav>

          {/* Product Dashboard Cards */}
          <main className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Products</h2>
              <div className="text-sm text-gray-400 font-medium">Total Items: {products.length}</div>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No products available. Click "+ Add Product" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {products.map((product) => {
                  let badgeColor = "bg-green-900 text-green-300 border border-green-700";
                  if (product.availability === "Low Stock") badgeColor = "bg-amber-900 text-amber-300 border border-amber-700";
                  if (product.availability === "Out of Stock") badgeColor = "bg-red-900 text-red-300 border border-red-700";

                  return (
                    <div key={product.id} className="bg-[#212529] rounded-lg border border-gray-700 overflow-hidden flex flex-col justify-between shadow-lg">
                      <div className="w-full h-64 bg-[#77818a] flex items-center justify-center relative">
                        <img src={product.image || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500"} alt={product.name} className="w-full h-full object-cover" />
                        <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded text-xs font-semibold ${badgeColor}`}>
                          {product.availability}
                        </span>
                      </div>
                      <div className="p-5 space-y-2 flex-grow">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{product.brand}</div>
                        <h3 className="text-xl font-semibold text-white">{product.name}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{product.description}</p>
                        <div className="text-2xl font-bold text-white pt-2">${parseFloat(product.price).toFixed(2)}</div>
                      </div>
                      <div className="p-5 pt-0 flex space-x-2">
                        <button onClick={() => openModal('edit', product.id)} className="flex-1 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white py-2 rounded text-sm font-medium">Edit</button>
                        <button onClick={() => deleteProduct(product.id)} className="border border-red-600 text-red-500 hover:bg-red-950 px-3 py-2 rounded text-sm">Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>

          {/* Modal Overlay Windows */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
              <div className="bg-[#2a3038] border border-gray-700 rounded-xl shadow-xl max-w-md w-full overflow-hidden text-left">
                <div className="bg-[#181e24] px-6 py-4 flex justify-between items-center text-white border-b border-gray-700">
                  <h3 className="text-lg font-bold">{modalMode === 'edit' ? 'Edit Product' : 'Add New Product'}</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl font-semibold">&times;</button>
                </div>
                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
                    <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} required className="w-full px-3 py-2 bg-[#1e252b] border border-gray-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Brand</label>
                    <input type="text" value={prodBrand} onChange={(e) => setProdBrand(e.target.value)} required className="w-full px-3 py-2 bg-[#1e252b] border border-gray-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Product Image URL</label>
                    <input type="url" value={prodImage} onChange={(e) => setProdImage(e.target.value)} className="w-full px-3 py-2 bg-[#1e252b] border border-gray-600 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Product Description</label>
                    <textarea rows="3" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} required className="w-full px-3 py-2 bg-[#1e252b] border border-gray-600 rounded-lg text-white resize-none"></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
                      <input type="number" step="0.01" min="0" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required className="w-full px-3 py-2 bg-[#1e252b] border border-gray-600 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Availability</label>
                      <select value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="w-full px-3 py-2 bg-[#1e252b] border border-gray-600 rounded-lg text-white">
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end space-x-3">
                    <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-[#0d6efd] text-white rounded-lg hover:bg-[#0b5ed7]">Save Product</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Authentication Forms */
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#2f303a] border border-[#2e303a] rounded-xl shadow-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-6 text-white">
              {currentPage === 'signup' ? 'Create an Account' : 'Welcome Back'}
            </h2>
            
            {message.text && (
              <div className={`p-3 mb-4 rounded text-sm text-center font-medium ${message.type === 'success' ? 'bg-green-900/40 text-green-400 border border-green-700' : 'bg-red-900/40 text-red-400 border border-red-700'}`} role="alert">
                {message.text}
              </div>
            )}

            <button type="button" className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-[#1f2028] border border-[#2e303a] text-white hover:bg-[#2e303a] transition-all" onClick={handleGoogleLogin} disabled={loading}>
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-6 text-center before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-full before:border-b before:border-gray-700">
              <span className="relative bg-[#2f303a] px-3 text-sm text-gray-400">or</span>
            </div>

            <form onSubmit={(e) => handleAuth(e, currentPage)} className="space-y-4 text-left">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1f2028] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
                  required
                />
              </div>

              {/* Password wrapper with eye toggle element */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <div className="relative w-full">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-[#1f2028] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.645C3.304 7.551 7.14 4.5 12 4.5c4.757 0 8.593 3.051 10.036 7.177a1.012 1.012 0 0 1 0 .645C20.696 16.449 16.86 19.5 12 19.5c-4.757 0-8.593-3.051-10.036-7.177Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password field with unique toggle tracking (Sign Up only) */}
              {currentPage === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                  <div className="relative w-full">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 bg-[#1f2028] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
                      required={currentPage === 'signup'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.645C3.304 7.551 7.14 4.5 12 4.5c4.757 0 8.593 3.051 10.036 7.177a1.012 1.012 0 0 1 0 .645C20.696 16.449 16.86 19.5 12 19.5c-4.757 0-8.593-3.051-10.036-7.177Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full mt-2 py-2.5 bg-[#c084fc]/15 text-[#c084fc] border-2 border-transparent rounded-lg font-semibold hover:border-[#c084fc]/50 focus:outline-none transition-all disabled:opacity-50" 
                disabled={loading}
              >
                {loading ? 'Processing...' : currentPage === 'signup' ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-sm text-gray-400">
              {currentPage === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="text-[#c084fc] font-semibold underline bg-none border-none p-0 cursor-pointer"
                onClick={() => {
                  setCurrentPage(currentPage === 'signup' ? 'signin' : 'signup')
                  setMessage({ type: '', text: '' })
                  setEmail('')
                  setPassword('')
                  setConfirmPassword('')
                  setShowPassword(false)
                  setShowConfirmPassword(false)
                }}
              >
                {currentPage === 'signup' ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './App.css'; // Essential for importing custom theme and layout styles

function App() {
  // --- AUTHENTICATION STATES ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // --- DASHBOARD FEATURE STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'orders' | 'settings' | 'support'
  const [contactMessage, setContactMessage] = useState({ name: '', email: '', body: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // --- EXTENSIVE SELECTION OF PRODUCT MOCK DATA ---
  const categories = ['All', 'Electronics', 'Peripherals', 'Audio', 'Wearables', 'Accessories'];
  
  const products = [
    { id: 1, title: 'Wireless Over-Ear Headphones', price: 99.99, desc: 'Premium high-quality sound with advanced active noise-canceling technology.', image: '🎧', category: 'Audio', stock: 12, rating: 4.8 },
    { id: 2, title: 'Smart Fitness Watch Pro', price: 149.99, desc: 'Track your daily health vitals, heart rate, workouts, and sleep in style.', image: '⌚', category: 'Wearables', stock: 8, rating: 4.5 },
    { id: 3, title: 'RGB Ergonomic Gaming Mouse', price: 49.99, desc: 'Ultra-lightweight design with customizable optical layout and macro profiles.', image: '🖱️', category: 'Peripherals', stock: 25, rating: 4.7 },
    { id: 4, title: 'Mechanical TKL Keyboard', price: 119.99, desc: 'Hot-swappable linear red switches with robust aluminum construction and RGB.', image: '⌨️', category: 'Peripherals', stock: 14, rating: 4.9 },
    { id: 5, title: 'True Wireless ANC Earbuds', price: 79.99, desc: 'Compact sweat-proof audio buds featuring immersive bass and transparency modes.', image: '🎙️', category: 'Audio', stock: 19, rating: 4.3 },
    { id: 6, title: 'UltraWide 4K Gaming Monitor', price: 399.99, desc: '34-inch curved display panel offering 144Hz refresh rate for ultimate clarity.', image: '🖥️', category: 'Electronics', stock: 5, rating: 4.9 },
    { id: 7, title: 'Dual-Device Wireless Charger', price: 34.99, desc: 'Sleek 15W Qi-certified fast charging station perfect for desks and nightstands.', image: '🔋', category: 'Electronics', stock: 40, rating: 4.2 },
    { id: 8, title: 'Waterproof Bluetooth Speaker', price: 59.99, desc: 'Rugged outdoor portable audio speaker carrying a 24-hour continuous battery life.', image: '📻', category: 'Audio', stock: 15, rating: 4.6 },
    { id: 9, title: 'Premium Leather Laptop Sleeve', price: 45.00, desc: 'Handcrafted genuine leather sleeve lined with soft microfiber interior protection.', image: '💼', category: 'Accessories', stock: 10, rating: 4.4 },
    { id: 10, title: 'HD Wide-Angle Webcam', price: 69.99, desc: '1080p 60fps desktop video streaming camera featuring low-light auto correction.', image: '📷', category: 'Electronics', stock: 22, rating: 4.5 },
    { id: 11, title: 'Aluminum Desktop Laptop Stand', price: 29.99, desc: 'Ergonomic elevated notebook elevator with heat dissipation ventilation design.', image: '📐', category: 'Accessories', stock: 30, rating: 4.7 },
    { id: 12, title: 'Smart Home LED Ambient Bar', price: 89.99, desc: 'Syncs dynamic ambient colored lighting setups directly to games, music, or movies.', image: '💡', category: 'Electronics', stock: 7, rating: 4.1 }
  ];

  // --- SUPABASE SESSION INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- USER AUTHENTICATION HANDLER (FIXED) ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Runs ONLY for incoming login operations
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        setUser(data.user);
      } else {
        // Runs ONLY for incoming registration sign-up operations
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setUser(data.user);
        alert('Registration successful! Please check your email inbox for verification links.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- GOOGLE OAUTH FLOW HANDLER ---
  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message);
    }
  };

  // --- SIGN OUT HANDLER ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Reset secondary local states
    setCart([]);
    setFavorites([]);
    setActiveTab('browse');
  };

  // --- CART OPERATIONS ---
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, amount) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + amount;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  // --- FAVORITES TOGGLE ---
  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // --- FILTERED SELECTION LOGIC ---
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- CALCULATING METRICS ---
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartTax = cartSubtotal * 0.08;
  const cartTotal = cartSubtotal + cartTax;
  const totalCartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  // --- CONTACT SUBMIT LOGIC ---
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactMessage.name && contactMessage.email && contactMessage.body) {
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        setContactMessage({ name: '', email: '', body: '' });
      }, 4000);
    }
  };

  // ==========================================
  // VIEW RENDER A: AUTHENTICATED SYSTEM USER (DASHBOARD PANEL)
  // ==========================================
  if (user) {
    return (
      <div className="min-h-screen bg-[#1e252b] font-sans text-gray-100 flex flex-col antialiased selection:bg-[#00d2ff]/30">
        
        {/* Navigation bar Header */}
        <nav className="bg-[#151a1e] border-b border-gray-800 px-4 sm:px-8 py-4 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-[#00d2ff] to-[#00b4db] bg-clip-text text-transparent cursor-pointer" onClick={() => setActiveTab('browse')}>
              NEXUSHUB
            </span>
            <div className="hidden md:flex space-x-1">
              <button 
                onClick={() => setActiveTab('browse')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'browse' ? 'bg-gray-800 text-[#00d2ff]' : 'text-gray-400 hover:text-white hover:bg-gray-800/40'}`}
              >
                Browse Shop
              </button>
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'orders' ? 'bg-gray-800 text-[#00d2ff]' : 'text-gray-400 hover:text-white hover:bg-gray-800/40'}`}
              >
                Orders
              </button>
              <button 
                onClick={() => setActiveTab('support')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'support' ? 'bg-gray-800 text-[#00d2ff]' : 'text-gray-400 hover:text-white hover:bg-gray-800/40'}`}
              >
                Contact Support
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Action Buttons */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-gray-800/80 border border-gray-700/60 rounded-xl hover:border-[#00d2ff]/40 text-gray-200 hover:text-[#00d2ff] transition-all duration-200"
            >
              <span>🛒</span>
              {totalCartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#00d2ff] text-[#151a1e] font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {totalCartItemsCount}
                </span>
              )}
            </button>

            <span className="text-sm text-gray-400 max-w-[160px] truncate hidden lg:inline-block border-l border-gray-800 pl-4">
              {user.email}
            </span>

            <button 
              onClick={handleLogout}
              className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-md"
            >
              Sign Out
            </button>
          </div>
        </nav>

        {/* SHOP CART SIDEBAR PANEL OVERLAY */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-md bg-[#151a1e] border-l border-gray-800 shadow-2xl flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="mr-2">Your Basket</span>
                    <span className="text-sm px-2.5 py-0.5 rounded-full bg-gray-800 text-[#00d2ff]">{totalCartItemsCount}</span>
                  </h2>
                  <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white text-xl p-2 rounded-lg hover:bg-gray-800/50 transition-colors">✕</button>
                </div>

                {/* Cart Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                      <div className="text-5xl mb-4">🛒</div>
                      <p className="text-lg font-medium mb-1">Your cart is empty</p>
                      <p className="text-sm max-w-xs mx-auto">Explore our storefront catalog items to add products to your list.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="bg-[#1e252b] p-4 rounded-xl border border-gray-800 flex items-center space-x-4">
                        <div className="text-3xl bg-gray-800 w-12 h-12 flex items-center justify-center rounded-lg">{item.image}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                          <p className="text-sm text-[#00d2ff] font-bold">${item.price}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="bg-gray-800 hover:bg-gray-700 text-white w-6 h-6 rounded flex items-center justify-center text-xs">-</button>
                            <span className="text-sm text-gray-200 font-mono w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="bg-gray-800 hover:bg-gray-700 text-white w-6 h-6 rounded flex items-center justify-center text-xs">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-400 p-2 text-sm">Remove</button>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart Summary Block Footer */}
                {cart.length > 0 && (
                  <div className="p-6 border-t border-gray-800 bg-[#191f24] space-y-4">
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex justify-between"><span>Subtotal</span><span className="text-white font-mono">${cartSubtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Estimated Tax (8%)</span><span className="text-white font-mono">${cartTax.toFixed(2)}</span></div>
                      <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-gray-800">
                        <span>Total Price</span><span className="text-[#00d2ff] font-mono">${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <button onClick={() => alert('Proceeding to deployment payment gateways integration simulator...')} className="w-full bg-gradient-to-r from-[#00d2ff] to-[#00b4db] text-[#151a1e] font-bold py-3 rounded-xl transition-transform duration-200 transform hover:scale-[1.02]">
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY LAYOUT SWITCH CONTAINER */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
          
          {/* TAB CONTENT 1: SHOPPING STOREFRONT DISPLAY */}
          {activeTab === 'browse' && (
            <>
              {/* Jumbotron Banner section */}
              <div className="bg-gradient-to-br from-[#1c2e3d] to-[#151a1e] border border-gray-800 rounded-3xl p-6 sm:p-10 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d2ff]/5 rounded-full filter blur-3xl -z-10" />
                <div className="mb-6 md:mb-0 max-w-xl">
                  <span className="text-xs font-bold text-[#00d2ff] tracking-widest uppercase bg-[#00d2ff]/10 px-3 py-1 rounded-full">Summer Tech drop 2026</span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-2 tracking-tight">Discover Next-Gen Workspace Hardware</h1>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">Upgrade your deployment productivity workflows with our curated components catalog listings.</p>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                  <div className="bg-gray-800/40 border border-gray-700/50 px-5 py-3 rounded-2xl flex flex-col"><span className="text-xs text-gray-400">Total Items Available</span><span className="text-xl font-bold text-white font-mono">{products.length}</span></div>
                  <div className="bg-gray-800/40 border border-gray-700/50 px-5 py-3 rounded-2xl flex flex-col"><span className="text-xs text-gray-400">Your Wishlist</span><span className="text-xl font-bold text-pink-400 font-mono">{favorites.length}</span></div>
                </div>
              </div>

              {/* Filtering Controls Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                {/* Search Bar Input */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search product names or features..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151a1e] border border-gray-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#00d2ff]/60 text-white placeholder-gray-500 transition-colors"
                  />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white">✕</button>}
                </div>

                {/* Category Badges Pills Scroller */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${selectedCategory === cat ? 'bg-[#00d2ff] text-[#151a1e] border-[#00d2ff] shadow-md shadow-[#00d2ff]/10' : 'bg-[#151a1e] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Products Catalog Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-[#151a1e] border border-gray-800 rounded-3xl">
                  <div className="text-4xl mb-3">🛠️</div>
                  <h3 className="text-lg font-bold text-white">No products found</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">We couldn't find matches for your current keyword search queries or filtered parameters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-[#151a1e] rounded-2xl border border-gray-800/80 p-5 flex flex-col justify-between hover:border-[#00d2ff]/30 transition-all duration-300 relative group"
                    >
                      {/* Favorite Ribbon button */}
                      <button 
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#1e252b]/80 border border-gray-800 flex items-center justify-center text-xs hover:scale-110 active:scale-95 transition-transform"
                      >
                        {favorites.includes(product.id) ? '❤️' : '🤍'}
                      </button>

                      <div>
                        {/* Display Asset Box */}
                        <div className="bg-[#1e252b] rounded-xl h-44 flex items-center justify-center text-6xl mb-4 group-hover:scale-[1.02] transition-transform duration-300 select-none">
                          {product.image}
                        </div>
                        
                        {/* Meta Tags info */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#00d2ff] bg-[#00d2ff]/5 px-2 py-0.5 rounded-md">{product.category}</span>
                          <span className="text-xs text-yellow-400 font-medium">★ {product.rating}</span>
                        </div>

                        <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#00d2ff] transition-colors line-clamp-1">{product.title}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">{product.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Unit Price</span>
                          <span className="text-lg font-black text-white font-mono">${product.price.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-[#1e252b] hover:bg-[#00d2ff] border border-gray-800 hover:border-[#00d2ff] text-gray-300 hover:text-[#151a1e] font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB CONTENT 2: MOCK USER HISTORIC ORDERS LIST */}
          {activeTab === 'orders' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-extrabold text-white mb-2">Order History Log</h2>
              <p className="text-sm text-gray-400 mb-6">Review invoices and shipping statuses for historic orders processed under your token profile.</p>
              
              <div className="space-y-4">
                <div className="bg-[#151a1e] border border-gray-800 rounded-2xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-800 text-xs text-gray-400">
                    <div>Order ID: <span className="font-mono text-white">NEX-984321</span></div>
                    <div>Placed on: <span className="text-white">May 14, 2026</span></div>
                    <div>Status: <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 font-bold uppercase">Delivered</span></div>
                  </div>
                  <div className="py-4 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl bg-gray-800 p-2 rounded-lg">🖥️</span>
                      <div>
                        <p className="font-bold text-white">UltraWide 4K Gaming Monitor</p>
                        <p className="text-xs text-gray-500">Qty: 1</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-white">$399.99</span>
                  </div>
                </div>

                <div className="bg-[#151a1e] border border-gray-800 rounded-2xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-800 text-xs text-gray-400">
                    <div>Order ID: <span className="font-mono text-white">NEX-431092</span></div>
                    <div>Placed on: <span className="text-white">March 28, 2026</span></div>
                    <div>Status: <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 font-bold uppercase">Delivered</span></div>
                  </div>
                  <div className="py-4 space-y-3 divide-y divide-gray-800/40 text-sm">
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl bg-gray-800 p-2 rounded-lg">🎧</span>
                        <div>
                          <p className="font-bold text-white">Wireless Over-Ear Headphones</p>
                          <p className="text-xs text-gray-500">Qty: 1</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-white">$99.99</span>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl bg-gray-800 p-2 rounded-lg">🖱️</span>
                        <div>
                          <p className="font-bold text-white">RGB Ergonomic Gaming Mouse</p>
                          <p className="text-xs text-gray-500">Qty: 2</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-white">$99.98</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: SUPPORT MESSAGE TICKETING FORM */}
          {activeTab === 'support' && (
            <div className="max-w-xl mx-auto bg-[#151a1e] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-2">Submit Technical Ticket</h2>
              <p className="text-xs text-gray-400 mb-6">Need assistance setting up adapters, configurations, or hardware features? Drop our engineers a note.</p>
              
              {contactSubmitted ? (
                <div className="bg-[#00d2ff]/10 border border-00d2ff]/20 rounded-2xl p-6 text-center text-[#00d2ff]">
                  <div className="text-4xl mb-2">📥</div>
                  <p className="font-bold text-lg mb-1">Message Sent Securely</p>
                  <p className="text-sm text-gray-400">Our engineering desk will dispatch follow-up diagnostics replies within 24 operational hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium">Your Name</label>
                    <input 
                      type="text" 
                      required 
                      value={contactMessage.name}
                      onChange={(e) => setContactMessage({...contactMessage, name: e.target.value})}
                      placeholder="e.g. Alex Mercer"
                      className="bg-[#1e252b] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d2ff]/50 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium">Callback Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={contactMessage.email}
                      onChange={(e) => setContactMessage({...contactMessage, email: e.target.value})}
                      placeholder="alex@example.com"
                      className="bg-[#1e252b] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d2ff]/50 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium">Inquiry Description</label>
                    <textarea 
                      required 
                      rows={4}
                      value={contactMessage.body}
                      onChange={(e) => setContactMessage({...contactMessage, body: e.target.value})}
                      placeholder="Describe compilation issues, delivery tracking requests, or system integration feedback..."
                      className="bg-[#1e252b] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d2ff]/50 transition-colors resize-none"
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#00d2ff] hover:bg-[#00b4db] text-[#151a1e] font-bold py-3 rounded-xl text-sm transition-colors mt-2 shadow-md">
                    Dispatch Ticket
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer info branding block */}
        <footer className="bg-[#151a1e] border-t border-gray-800 mt-auto py-6 text-center text-xs text-gray-500 font-medium tracking-wide">
          &copy; 2026 NEXUSHUB Corporation. Running over production endpoints seamlessly.
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW RENDER B: UNAUTHENTICATED GUEST USER (GLASSMORPHISM AUTH PORTAL)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#1e252b] font-sans flex items-center justify-center p-4 relative overflow-hidden antialiased selection:bg-[#00d2ff]/30">
      
      {/* Background Graphic Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#00d2ff]/5 rounded-full filter blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl" />

      {/* Main Authentication Card Box */}
      <div className="auth-form w-full max-w-md z-10 transition-all duration-300">
        <h2 className="tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="subtitle">
          {isLogin ? 'Please enter your credentials to log in.' : 'Register below to access your global store client dashboard.'}
        </p>

        {/* Error Notification Alert */}
        {error && (
          <div className="error-message flex items-center space-x-2 animate-shake">
            <span>⚠️</span>
            <span className="flex-1 text-xs">{error}</span>
          </div>
        )}

        {/* Credentials Form Submission */}
        <form onSubmit={handleAuth} className="space-y-4 mt-6">
          <div className="form-group">
            <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full text-sm"
            />
          </div>

          <div className="form-group">
            <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Password</label>
            <div className="password-wrapper relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full text-sm pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn absolute right-3 inset-y-0 text-xs font-bold text-gray-400 hover:text-[#00d2ff] transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn w-full mt-6 font-bold py-3 rounded-xl text-sm tracking-wide shadow-lg">
            {loading ? 'Processing Workspace...' : isLogin ? 'Sign In to Hub' : 'Complete Registration'}
          </button>
        </form>

        {/* Visual Separation Line */}
        <div className="divider my-6 flex items-center justify-center text-xs text-gray-500 uppercase font-bold tracking-widest">
          <span className="px-3 bg-[#1e252b] z-10">or continue with</span>
        </div>

        {/* Google OAuth Access Button */}
        <button onClick={handleGoogleLogin} className="google-btn w-full flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-transform duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-md">
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Cloud Identity
        </button>

        {/* Auth Mode Toggle Link */}
        <div className="toggle-auth text-center mt-6 text-sm text-gray-400">
          {isLogin ? "Don't have an account yet? " : "Already registered here? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-[#00d2ff] hover:underline focus:outline-none ml-1 font-semibold"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
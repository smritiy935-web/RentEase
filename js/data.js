// Default Initial Mock Data
const initialProducts = [
    {
        id: "p1",
        name: "Ergonomic Office Chair",
        category: "furniture",
        monthlyRent: 499,
        securityDeposit: 1000,
        image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Premium ergonomic chair with lumbar support, perfect for long working hours."
    },
    {
        id: "p2",
        name: "Queen Size Solid Wood Bed",
        category: "furniture",
        monthlyRent: 1299,
        securityDeposit: 2500,
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Sturdy solid wood bed with an elegant finish. Mattress not included."
    },
    {
        id: "p3",
        name: "3-Seater Velvet Sofa",
        category: "furniture",
        monthlyRent: 1599,
        securityDeposit: 3000,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "Luxurious velvet sofa, spacious and comfortable for your living room."
    },
    {
        id: "p4",
        name: "Smart LED TV 55-inch",
        category: "appliances",
        monthlyRent: 1899,
        securityDeposit: 4000,
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "4K UHD Smart TV with built-in streaming apps and voice control."
    },
    {
        id: "p5",
        name: "Front Load Washing Machine",
        category: "appliances",
        monthlyRent: 1199,
        securityDeposit: 2500,
        image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "7kg front load washing machine with multiple wash programs and heater."
    },
    {
        id: "p6",
        name: "Double Door Refrigerator",
        category: "appliances",
        monthlyRent: 1399,
        securityDeposit: 3000,
        image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: "250L Frost-free double door refrigerator with inverter compressor."
    }
];

// Initialize data in localStorage if not present
function initializeData() {
    if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify(initialProducts));
    }
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
    if (!localStorage.getItem('rentals')) {
        localStorage.setItem('rentals', JSON.stringify([]));
    }
    if (!localStorage.getItem('user')) {
        // Mock user session
        localStorage.setItem('user', JSON.stringify({ isLoggedIn: true, name: "John Doe", role: "user" }));
    }
}

initializeData();

// Utility functions to access data
window.DataService = {
    getProducts: () => JSON.parse(localStorage.getItem('products') || '[]'),
    getCart: () => JSON.parse(localStorage.getItem('cart') || '[]'),
    addToCart: (productId) => {
        const cart = window.DataService.getCart();
        if (!cart.includes(productId)) {
            cart.push(productId);
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated'));
            return true;
        }
        return false;
    },
    getCartCount: () => {
        return window.DataService.getCart().length;
    }
};

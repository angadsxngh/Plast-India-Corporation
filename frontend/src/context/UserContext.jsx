import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);

    const fetchUser = async() => {
        try {
            setIsLoading(true);
            const response = await fetch(`${BASE_URL}/user`, {
                credentials: "include",
            });
            if (!response.ok) {
                // Clear user state if unauthorized (this is normal when not logged in)
                if (response.status === 401) {
                    setUser(null);
                    return; // Don't throw error for 401, it's a normal state
                }
                throw new Error("Failed to fetch user data");
            }
            const data = await response.json();
            setUser(data);
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    const login = (userData) => {
        setUser(userData);
    }

    const logout = () => {
        setUser(null);
        setCategories([]);
        setProducts([]);
        setPurchaseOrders([]);
        setSalesOrders([]);
    }

    const fetchCategories = async() => {
        try {
            const response = await fetch(`${BASE_URL}/get-categories`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch categories");
            }
            const data = await response.json();
            setCategories(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]); // Set to empty array on error
            throw new Error("Failed to fetch categories");
        }
    }

    const fetchProducts = async() => {
        try {
            const response = await fetch(`${BASE_URL}/get-products`, {
                credentials: "include",
            });
            if (!response.ok) {
                console.log("error", response.statusText);
                throw new Error("Failed to fetch products");
            }
            const data = await response.json();
            setProducts(Array.isArray(data.data) ? data.data : []);
            console.log("products", products);
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]); // Set to empty array on error
            throw new Error("Failed to fetch products");
        }
    }

    const fetchPurchaseOrders = async() => {
        try {
            const response = await fetch(`${BASE_URL}/get-purchase-orders`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch purchase orders");
            }
            const data = await response.json();
            setPurchaseOrders(Array.isArray(data.data) ? data.data : []);
        }
        catch (error) {
            console.error("Error fetching purchase orders:", error);
            setPurchaseOrders([]); // Set to empty array on error
            throw new Error("Failed to fetch purchase orders");
        }
    }

    const fetchSalesOrders = async() => {
        try {
            const response = await fetch(`${BASE_URL}/get-sales-orders`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch sales orders");
            }
            const data = await response.json();
            setSalesOrders(Array.isArray(data.data) ? data.data : []);
        }
        catch (error) {
            console.error("Error fetching sales orders:", error);
            setSalesOrders([]); // Set to empty array on error
            throw new Error("Failed to fetch sales orders");
        }
    }

    // Fetch user on mount to check authentication status
    useEffect(() => {
        fetchUser();
    }, []);

    // Fetch other data when user changes
    useEffect(() => {
        // Only fetch data if user is logged in
        if (user) {
            fetchCategories();
            fetchProducts();
            fetchPurchaseOrders();
            fetchSalesOrders();
        }
    }, [user?.id]); // Only refetch when user changes

    return (
        <UserContext.Provider value={{ 
            user, isLoading, categories, products, purchaseOrders, salesOrders,
            refreshUser: fetchUser, refreshCategories: fetchCategories, refreshProducts: fetchProducts, refreshPurchaseOrders: fetchPurchaseOrders, refreshSalesOrders: fetchSalesOrders,
            login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
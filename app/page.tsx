"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { UserIcon, Shield, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import AuthPage from "./auth/page"
import CategoryPage from "./categories/page"
import UserPage from "./users/page"
import ProductsPage from "./products/page" // Declare ProductsPage here
import { useRouter } from "next/navigation"

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  image: string
  status: "active" | "inactive"
}

interface UserData {
  username: string
  role: "admin" | "user"
  name: string
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'MacBook Pro 14"',
    description: "Apple MacBook Pro 14-inch with M3 chip",
    price: 59900,
    category: "Electronics",
    stock: 15,
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 2,
    name: "iPhone 15 Pro",
    description: "Latest iPhone with titanium design",
    price: 39900,
    category: "Electronics",
    stock: 25,
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 3,
    name: "AirPods Pro",
    description: "Wireless earbuds with noise cancellation",
    price: 8900,
    category: "Audio",
    stock: 50,
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 4,
    name: "iPad Air",
    description: "Powerful tablet for work and creativity",
    price: 21900,
    category: "Electronics",
    stock: 8,
    image: "/placeholder.svg?height=100&width=100",
    status: "inactive",
  },
]

export default function ProductManagement() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const { theme, setTheme } = useTheme();

  // dashboard state
  const [currentPage, setCurrentPage] = useState<"categories" | "products" | "users">("categories");
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) {
      router.replace("/auth");
    } else {
      setUserData(JSON.parse(savedUser));
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null;
  if (!userData) return null;

  // handler
  const handleNavigateToProducts = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    setCurrentPage("products");
  };
  const handleNavigateToUsers = () => setCurrentPage("users");
  const handleNavigateToCategories = () => {
    setCurrentPage("categories");
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-black cursor-pointer" onClick={handleNavigateToCategories}>
                Product Management
              </h1>
              {currentPage === "products" && selectedCategory && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-lg text-gray-600">{selectedCategory.name}</span>
                </>
              )}
              {currentPage === "users" && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-lg text-gray-600">จัดการผู้ใช้</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-background rounded-lg">
                <span className="text-sm font-medium text-black">{userData.name}</span>
                <span className="text-xs text-gray-500">(@{userData.username})</span>
                <span className="border border-gray-300 text-gray-700 text-xs rounded px-2 py-0.5 ml-2">
                  {userData.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                </span>
              </div>
              <button
                onClick={() => {
                  setUserData(null);
                  localStorage.removeItem("currentUser");
                  router.replace("/auth");
                }}
                className="border border-gray-300 text-black hover:bg-gray-50 bg-transparent rounded px-3 py-1"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === "categories" && (
          <CategoryPage
            userData={userData}
            onNavigateToProducts={handleNavigateToProducts}
            onNavigateToUsers={handleNavigateToUsers}
          />
        )}
        {currentPage === "products" && selectedCategory && (
          <ProductsPage
            userData={userData}
            category={selectedCategory}
            onNavigateBack={handleNavigateToCategories}
          />
        )}
        {currentPage === "users" && userData.role === "admin" && (
          <UserPage userData={userData} onNavigateBack={handleNavigateToCategories} />
        )}
      </div>
    </div>
  );
}

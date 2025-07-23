import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    // Fetch summary data (เฉพาะ categories และ products)
    const [categoriesResult, productsResult] = await Promise.all([
      supabaseServer.from("categories").select("name, created_at"),
      supabaseServer.from("products").select("price, stock, status, category_id, categories(name)"),
    ])

    console.log("categoriesResult.error:", categoriesResult.error)
    console.log("productsResult.error:", productsResult.error)

    if (categoriesResult.error || productsResult.error) {
      throw new Error("Failed to fetch data")
    }

    const categories = categoriesResult.data || []
    const products = productsResult.data || []

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Summary Sheet (ไม่มี users)
    const summaryData = [
      { รายการ: "จำนวนหมวดหมู่ทั้งหมด", จำนวน: categories.length },
      { รายการ: "", จำนวน: "" },
      { รายการ: "จำนวนสินค้าทั้งหมด", จำนวน: products.length },
      { รายการ: "สินค้าที่เปิดใช้งาน", จำนวน: products.filter((p) => p.status === "active").length },
      { รายการ: "สินค้าที่ปิดใช้งาน", จำนวน: products.filter((p) => p.status === "inactive").length },
      {
        รายการ: "มูลค่าสินค้าคงเหลือ (บาท)",
        จำนวน: products.reduce((sum, p) => sum + p.price * p.stock, 0).toLocaleString(),
      },
      { รายการ: "จำนวนสินค้าคงเหลือ (ชิ้น)", จำนวน: products.reduce((sum, p) => sum + p.stock, 0).toLocaleString() },
    ]

    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, "สรุปภาพรวม")

    // Products by Category Sheet
    const categoryStats = categories.map((category) => {
      const categoryProducts = products.filter((p) => p.categories?.name === category.name)
      return {
        หมวดหมู่: category.name,
        จำนวนสินค้า: categoryProducts.length,
        สินค้าเปิดใช้งาน: categoryProducts.filter((p) => p.status === "active").length,
        สินค้าปิดใช้งาน: categoryProducts.filter((p) => p.status === "inactive").length,
        มูลค่าสินค้าคงเหลือ: categoryProducts.reduce((sum, p) => sum + p.price * p.stock, 0),
        จำนวนสินค้าคงเหลือ: categoryProducts.reduce((sum, p) => sum + p.stock, 0),
      }
    })

    const categorySheet = XLSX.utils.json_to_sheet(categoryStats)
    categorySheet["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, categorySheet, "สถิติตามหมวดหมู่")

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Create filename with current date
    const currentDate = new Date()
      .toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-")
    const filename = `รายงานสรุป_${currentDate}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Export summary error:", error)
    return NextResponse.json({ error: String(error), stack: error?.stack }, { status: 500 })
  }
}

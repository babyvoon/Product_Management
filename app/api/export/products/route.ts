import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Fetch products data with category information
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Prepare data for Excel
    const excelData =
      products?.map((product, index) => ({
        ลำดับ: index + 1,
        ชื่อสินค้า: product.name,
        รายละเอียด: product.description,
        หมวดหมู่: product.categories?.name || "ไม่ระบุ",
        "ราคา (บาท)": product.price,
        จำนวนคงเหลือ: product.stock,
        สถานะ: product.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน",
        วันที่สร้าง: new Date(product.created_at).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        วันที่อัพเดท: new Date(product.updated_at).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })) || []

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 8 }, // ลำดับ
      { wch: 25 }, // ชื่อสินค้า
      { wch: 40 }, // รายละเอียด
      { wch: 20 }, // หมวดหมู่
      { wch: 12 }, // ราคา
      { wch: 12 }, // จำนวนคงเหลือ
      { wch: 12 }, // สถานะ
      { wch: 20 }, // วันที่สร้าง
      { wch: 20 }, // วันที่อัพเดท
    ]
    worksheet["!cols"] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายการสินค้า")

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
    const filename = `รายการสินค้า_${currentDate}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Export products error:", error)
    return NextResponse.json({ error: "Failed to export products data" }, { status: 500 })
  }
}

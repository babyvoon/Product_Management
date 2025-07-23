import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    // Fetch categories data with product count
    const { data: categories, error } = await supabaseServer
      .from("categories")
      .select(`
        *,
        products (count)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Prepare data for Excel
    const excelData =
      categories?.map((category, index) => ({
        ลำดับ: index + 1,
        ชื่อหมวดหมู่: category.name,
        รายละเอียด: category.description,
        ไอคอน: category.icon,
        จำนวนสินค้า: category.products?.[0]?.count || 0,
        วันที่สร้าง: new Date(category.created_at).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        วันที่อัพเดท: new Date(category.updated_at).toLocaleDateString("th-TH", {
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
      { wch: 25 }, // ชื่อหมวดหมู่
      { wch: 40 }, // รายละเอียด
      { wch: 8 }, // ไอคอน
      { wch: 12 }, // จำนวนสินค้า
      { wch: 20 }, // วันที่สร้าง
      { wch: 20 }, // วันที่อัพเดท
    ]
    worksheet["!cols"] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายการหมวดหมู่")

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
    const filename = `รายการหมวดหมู่_${currentDate}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Export categories error:", error)
    return NextResponse.json({ error: "Failed to export categories data" }, { status: 500 })
  }
}

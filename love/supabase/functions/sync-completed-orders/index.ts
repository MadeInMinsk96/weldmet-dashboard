// Edge Function to sync completed orders from Google Sheets to Supabase
// This function should run periodically (via cron) to check for completed orders

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Parse request body for spreadsheet info (use defaults if not provided)
    let spreadsheetId = '1fOF3IU94lgNTdgaTiKPj-gcoz_cBq9pVZoaj1tGcF9U';
    let sheetGid = '1485484311';

    try {
      const body = await req.json();
      if (body.spreadsheetId) spreadsheetId = body.spreadsheetId;
      if (body.sheetGid) sheetGid = body.sheetGid;
    } catch (e) {
      // Use defaults if body is empty or invalid
    }

    // Fetch data from Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}`;
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = csvText.split('\n').filter(row => row.trim());

    if (rows.length <= 1) {
      return new Response(
        JSON.stringify({ message: 'No data in sheet', saved: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse CSV
    const headers = rows[0].split(',').map(h => h.trim());
    const completedOrders = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      const order: any = {};

      headers.forEach((header, index) => {
        order[header] = values[index] || '';
      });

      // Check if order is completed (overall status is "Готово")
      const overallStatus = (order['Общая готовность'] || order['Overall Status'] || '').toLowerCase().trim();
      
      if (overallStatus === 'готово' || overallStatus === 'ready') {
        // Parse order data
        const orderNumber = order['Номер заявки'] || order['Order Number'] || '';
        const manager = order['Менеджер'] || order['Manager'] || '';
        
        // Parse times (convert minutes to hours for laser cutting)
        const laserTime = parseFloat(order['Резка'] || order['Cutting'] || '0') / 60; // minutes to hours
        const cleaningTime = parseFloat(order['Зачистка/травление'] || order['Cleaning'] || '0');
        const bendingTime = parseFloat(order['Гибка'] || order['Bending'] || '0');
        const weldingTime = parseFloat(order['Сварка'] || order['Welding'] || '0');
        const paintingTime = parseFloat(order['Покраска'] || order['Painting'] || '0');
        const warehouse75Time = parseFloat(order['Склад №75'] || order['Warehouse 75'] || '0');
        const warehouseTime = parseFloat(order['Склад'] || order['Warehouse'] || '0');
        
        const totalTime = laserTime + cleaningTime + bendingTime + weldingTime + paintingTime + warehouse75Time + warehouseTime;

        if (orderNumber) {
          completedOrders.push({
            order_number: orderNumber,
            manager: manager || null,
            laser_time: laserTime,
            cleaning_time: cleaningTime,
            bending_time: bendingTime,
            welding_time: weldingTime,
            painting_time: paintingTime,
            warehouse75_time: warehouse75Time,
            warehouse_time: warehouseTime,
            total_time: totalTime,
            completed_at: new Date().toISOString()
          });
        }
      }
    }

    if (completedOrders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No completed orders found', saved: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to Supabase (use upsert to avoid duplicates)
    let savedCount = 0;
    
    for (const order of completedOrders) {
      // Check if order already exists
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/completed_orders?order_number=eq.${order.order_number}&select=id`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const existing = await checkResponse.json();

      if (!existing || existing.length === 0) {
        // Insert new record
        const insertResponse = await fetch(
          `${supabaseUrl}/rest/v1/completed_orders`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(order)
          }
        );

        if (insertResponse.ok) {
          savedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Sync completed successfully', 
        found: completedOrders.length,
        saved: savedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sync-completed-orders:', error);
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'SYNC_ERROR',
          message: error.message 
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
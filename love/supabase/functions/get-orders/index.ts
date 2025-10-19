Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Get Supabase URL and key from environment
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Get spreadsheet details from request body or use defaults
        const requestData = await req.json().catch(() => ({}));
        const spreadsheetId = requestData.spreadsheetId || '1fOF3IU94lgNTdgaTiKPj-gcoz_cBq9pVZoaj1tGcF9U';
        const sheetGid = requestData.sheetGid || '1485484311';
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}`;

        // Fetch CSV data
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch data from Google Sheets');
        }

        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        // Parse CSV data
        const orders = [];
        const completedOrders = [];
        
        // Start from row 1 (skip header row 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Split by comma, handling quoted values
            const columns = [];
            let currentColumn = '';
            let insideQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    columns.push(currentColumn.trim());
                    currentColumn = '';
                } else {
                    currentColumn += char;
                }
            }
            columns.push(currentColumn.trim());

            // Check if we have enough columns
            if (columns.length < 18) {
                continue;
            }

            // Column R (index 17) - Overall status
            const overallStatus = columns[17] || '';
            const orderNumber = columns[3] || '';
            
            // Skip system rows
            const systemRows = ['Номер заявки', 'Администрация', 'Собственные нужды', 'Простой'];
            if (systemRows.includes(orderNumber)) {
                continue;
            }
            
            // Check if order is marked as "Готово"
            const isCompleted = overallStatus.toLowerCase().includes('готово');
            
            // Parse order data
            const manager = columns[2] || '';
            const cuttingTimeMinutes = parseFloat(columns[6]) || 0;
            const cleaningTime = parseFloat(columns[8]) || 0;
            const bendingTime = parseFloat(columns[10]) || 0;
            const weldingTime = parseFloat(columns[12]) || 0;
            const paintingTime = parseFloat(columns[14]) || 0;
            
            // Convert cutting time from minutes to hours
            const cuttingTime = cuttingTimeMinutes / 60;
            
            if (orderNumber) {
                // Create order object
                const order = {
                    manager: manager,
                    orderNumber: orderNumber,
                    operationType: columns[4] || '',
                    shipmentDate: columns[5] || '',
                    cuttingTime: cuttingTimeMinutes,
                    cuttingStatus: columns[7] || '',
                    cleaningTime: cleaningTime,
                    cleaningStatus: columns[9] || '',
                    bendingTime: bendingTime,
                    bendingStatus: columns[11] || '',
                    weldingTime: weldingTime,
                    weldingStatus: columns[13] || '',
                    paintingTime: paintingTime,
                    paintingStatus: columns[15] || '',
                    overallStatus: overallStatus,
                    warehouse75Time: parseFloat(columns[16]) || 0,
                    warehouse75Status: '',
                    warehouseTime: 0,
                    warehouseStatus: ''
                };
                
                // Add to orders list (including completed orders)
                orders.push(order);
                
                // If completed, also add to completed orders for database
                if (isCompleted) {
                    const totalTime = cuttingTime + cleaningTime + bendingTime + weldingTime + paintingTime;
                    completedOrders.push({
                        order_number: orderNumber,
                        manager: manager || null,
                        laser_time: cuttingTime,
                        cleaning_time: cleaningTime,
                        bending_time: bendingTime,
                        welding_time: weldingTime,
                        painting_time: paintingTime,
                        warehouse75_time: order.warehouse75Time,
                        warehouse_time: order.warehouseTime,
                        total_time: totalTime
                    });
                }
            }
        }

        // Save completed orders to Supabase
        if (completedOrders.length > 0 && supabaseUrl && supabaseKey) {
            for (const completedOrder of completedOrders) {
                try {
                    // Check if order already exists
                    const checkResponse = await fetch(
                        `${supabaseUrl}/rest/v1/completed_orders?order_number=eq.${completedOrder.order_number}&select=id`,
                        {
                            headers: {
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${supabaseKey}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    const existing = await checkResponse.json();
                    
                    // Only insert if doesn't exist
                    if (!existing || existing.length === 0) {
                        await fetch(
                            `${supabaseUrl}/rest/v1/completed_orders`,
                            {
                                method: 'POST',
                                headers: {
                                    'apikey': supabaseKey,
                                    'Authorization': `Bearer ${supabaseKey}`,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify(completedOrder)
                            }
                        );
                    }
                } catch (error) {
                    console.error('Error saving completed order:', completedOrder.order_number, error);
                }
            }
        }

        return new Response(JSON.stringify({
            data: orders,
            count: orders.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);

        const errorResponse = {
            error: {
                code: 'FETCH_ORDERS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

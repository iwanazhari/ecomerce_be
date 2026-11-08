"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
/**
 * POST /store/shipping/cheapest
 * Returns the cheapest shipping option.
 */
async function POST(req, res) {
    // Forward to calculate endpoint, then pick cheapest
    const calculateRoute = (await import('../calculate/route.js'));
    // Create a mock response capture
    const mockRes = {
        status: (code) => ({
            json: (data) => {
                if (code !== 200)
                    return mockRes.status(code).json(data);
                const rates = data.rates ?? [];
                if (rates.length === 0) {
                    return { rate: null };
                }
                const cheapest = rates.sort((a, b) => a.price - b.price)[0];
                return { rate: cheapest };
            },
        }),
    };
    const result = await calculateRoute.POST(req, mockRes);
    res.json(result ?? { rate: null });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3NoaXBwaW5nL2NoZWFwZXN0L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBTUEsb0JBcUJDO0FBekJEOzs7R0FHRztBQUNJLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxvREFBb0Q7SUFDcEQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFRLENBQUE7SUFFckUsaUNBQWlDO0lBQ2pDLE1BQU0sT0FBTyxHQUFHO1FBQ2QsTUFBTSxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxDQUFDLElBQVMsRUFBRSxFQUFFO2dCQUNsQixJQUFJLElBQUksS0FBSyxHQUFHO29CQUFFLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFBO2dCQUM5QixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUE7Z0JBQ3ZCLENBQUM7Z0JBQ0QsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNyRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFBO1lBQzNCLENBQUM7U0FDRixDQUFDO0tBQ0gsQ0FBQTtJQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDdEQsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtBQUNwQyxDQUFDIn0=
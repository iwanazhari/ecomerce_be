"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
/**
 * POST /store/shipping/fastest
 * Returns the fastest shipping option.
 */
async function POST(req, res) {
    const calculateRoute = (await import('../calculate/route.js'));
    const mockRes = {
        status: (code) => ({
            json: (data) => {
                if (code !== 200)
                    return mockRes.status(code).json(data);
                const rates = data.rates ?? [];
                if (rates.length === 0) {
                    return { rate: null };
                }
                const fastest = rates.sort((a, b) => a.estimatedDays - b.estimatedDays)[0];
                return { rate: fastest };
            },
        }),
    };
    const result = await calculateRoute.POST(req, mockRes);
    res.json(result ?? { rate: null });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3NoaXBwaW5nL2Zhc3Rlc3Qvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSxvQkFtQkM7QUF2QkQ7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sY0FBYyxHQUFHLENBQUMsTUFBTSxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBUSxDQUFBO0lBRXJFLE1BQU0sT0FBTyxHQUFHO1FBQ2QsTUFBTSxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxDQUFDLElBQVMsRUFBRSxFQUFFO2dCQUNsQixJQUFJLElBQUksS0FBSyxHQUFHO29CQUFFLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFBO2dCQUM5QixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUE7Z0JBQ3ZCLENBQUM7Z0JBQ0QsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNwRixPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFBO1lBQzFCLENBQUM7U0FDRixDQUFDO0tBQ0gsQ0FBQTtJQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDdEQsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtBQUNwQyxDQUFDIn0=
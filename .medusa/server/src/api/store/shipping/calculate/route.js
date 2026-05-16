"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const axios_1 = __importDefault(require("axios"));
/**
 * POST /store/shipping/calculate
 * Calculate shipping rates via RajaOngkir.
 *
 * Body: { destination: { city, province, postalCode }, items: [{ weight, quantity }] }
 */
async function POST(req, res) {
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: 'Shipping calculation not configured. Set RAJAONGKIR_API_KEY.',
        });
    }
    const { destination, items } = req.body;
    if (!destination?.city || !items?.length) {
        return res.status(400).json({ error: 'destination and items are required' });
    }
    // Calculate total weight in grams
    const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 500) * item.quantity, 0);
    try {
        // RajaOngkir Starter API (free tier)
        const response = await axios_1.default.post('https://api.rajaongkir.com/starter/cost', {
            origin: '152', // Jakarta (change to your warehouse city ID)
            destination: destination.city,
            weight: totalWeight,
            courier: 'jne:jnt:pos',
        }, {
            headers: {
                key: apiKey,
                'Content-Type': 'application/json',
            },
        });
        const results = response.data?.rajaongkir?.results ?? [];
        const rates = [];
        for (const courier of results) {
            for (const cost of courier.costs ?? []) {
                rates.push({
                    courier: courier.code.toUpperCase(),
                    service: cost.service,
                    price: cost.cost?.[0]?.value ?? 0,
                    estimatedDays: parseInt(cost.cost?.[0]?.etd ?? '0') || 3,
                });
            }
        }
        res.json({ rates });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to calculate shipping',
            detail: error.response?.data ?? error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3NoaXBwaW5nL2NhbGN1bGF0ZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQVNBLG9CQTREQztBQXBFRCxrREFBeUI7QUFFekI7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQTtJQUU3QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLEtBQUssRUFBRSw4REFBOEQ7U0FDdEUsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLElBR2xDLENBQUE7SUFFRCxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUN6QyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLG9DQUFvQyxFQUFFLENBQUMsQ0FBQTtJQUM5RSxDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFFOUYsSUFBSSxDQUFDO1FBQ0gscUNBQXFDO1FBQ3JDLE1BQU0sUUFBUSxHQUFHLE1BQU0sZUFBSyxDQUFDLElBQUksQ0FDL0IseUNBQXlDLEVBQ3pDO1lBQ0UsTUFBTSxFQUFFLEtBQUssRUFBRSw2Q0FBNkM7WUFDNUQsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJO1lBQzdCLE1BQU0sRUFBRSxXQUFXO1lBQ25CLE9BQU8sRUFBRSxhQUFhO1NBQ3ZCLEVBQ0Q7WUFDRSxPQUFPLEVBQUU7Z0JBQ1AsR0FBRyxFQUFFLE1BQU07Z0JBQ1gsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztTQUNGLENBQ0YsQ0FBQTtRQUVELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUE7UUFDeEQsTUFBTSxLQUFLLEdBQWlGLEVBQUUsQ0FBQTtRQUU5RixLQUFLLE1BQU0sT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQzlCLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDVCxPQUFPLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ25DLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztvQkFDckIsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQztvQkFDakMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUM7aUJBQ3pELENBQUMsQ0FBQTtZQUNKLENBQUM7UUFDSCxDQUFDO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7SUFDckIsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLDhCQUE4QjtZQUNyQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLElBQUksS0FBSyxDQUFDLE9BQU87U0FDOUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==
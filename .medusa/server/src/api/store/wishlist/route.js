"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
async function GET(req, res) {
    const wishlistService = req.scope.resolve('wishlist');
    const authContext = req.authContext;
    if (!authContext?.customer_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const [items, count] = await wishlistService.listAndCountWishlistItems({
        customer_id: authContext.customer_id,
    });
    res.json({ wishlist: { items, count } });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3dpc2hsaXN0L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esa0JBVUM7QUFWTSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxlQUFlLEdBQVEsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7SUFDMUQsTUFBTSxXQUFXLEdBQUksR0FBVyxDQUFDLFdBQW1ELENBQUE7SUFDcEYsSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUM5QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtJQUM3RCxDQUFDO0lBQ0QsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLGVBQWUsQ0FBQyx5QkFBeUIsQ0FBQztRQUNyRSxXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7S0FDckMsQ0FBQyxDQUFBO0lBQ0YsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDMUMsQ0FBQyJ9
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPEDITION_MODULE = void 0;
exports.GET = GET;
exports.POST = POST;
exports.DELETE = DELETE;
exports.EXPEDITION_MODULE = 'expedition';
/**
 * GET /admin/expeditions/[id]
 * Get a single expedition by ID
 */
async function GET(req, res) {
    const expeditionService = req.scope.resolve(exports.EXPEDITION_MODULE);
    const { id } = req.params;
    try {
        const expedition = await expeditionService.retrieveExpedition(id);
        res.json({ expedition });
    }
    catch (error) {
        res.status(404).json({ type: 'not_found', message: `Expedition not found: ${id}` });
    }
}
/**
 * POST /admin/expeditions/[id]
 * Update an expedition
 */
async function POST(req, res) {
    const expeditionService = req.scope.resolve(exports.EXPEDITION_MODULE);
    const { id } = req.params;
    const body = req.body;
    try {
        const updateData = { id };
        if (body.name !== undefined)
            updateData.name = body.name;
        if (body.code !== undefined)
            updateData.code = body.code;
        if (body.tracking_url_template !== undefined)
            updateData.tracking_url_template = body.tracking_url_template;
        if (body.is_active !== undefined)
            updateData.is_active = body.is_active;
        if (body.description !== undefined)
            updateData.description = body.description;
        if (body.flat_rate !== undefined)
            updateData.flat_rate = body.flat_rate;
        if (body.is_store_delivery !== undefined)
            updateData.is_store_delivery = body.is_store_delivery;
        const expedition = await expeditionService.updateExpeditions(updateData);
        res.json({ expedition });
    }
    catch (error) {
        res.status(404).json({ type: 'not_found', message: `Expedition not found: ${id}` });
    }
}
/**
 * DELETE /admin/expeditions/[id]
 * Delete an expedition
 */
async function DELETE(req, res) {
    const expeditionService = req.scope.resolve(exports.EXPEDITION_MODULE);
    const { id } = req.params;
    try {
        await expeditionService.deleteExpeditions(id);
        res.json({ id, deleted: true });
    }
    catch (error) {
        res.status(404).json({ type: 'not_found', message: `Expedition not found: ${id}` });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2V4cGVkaXRpb25zL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBUUEsa0JBVUM7QUFNRCxvQkFvQkM7QUFNRCx3QkFVQztBQTFEWSxRQUFBLGlCQUFpQixHQUFHLFlBQVksQ0FBQTtBQUU3Qzs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx5QkFBaUIsQ0FBQyxDQUFBO0lBQzlELE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO0lBRXpCLElBQUksQ0FBQztRQUNILE1BQU0sVUFBVSxHQUFHLE1BQU0saUJBQWlCLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDakUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUE7SUFDMUIsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3JGLENBQUM7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMseUJBQWlCLENBQUMsQ0FBQTtJQUM5RCxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtJQUN6QixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO0lBRTVCLElBQUksQ0FBQztRQUNILE1BQU0sVUFBVSxHQUFRLEVBQUUsRUFBRSxFQUFFLENBQUE7UUFDOUIsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVM7WUFBRSxVQUFVLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7UUFDeEQsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVM7WUFBRSxVQUFVLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7UUFDeEQsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUssU0FBUztZQUFFLFVBQVUsQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUE7UUFDM0csSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVM7WUFBRSxVQUFVLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7UUFDdkUsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLFNBQVM7WUFBRSxVQUFVLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUE7UUFDN0UsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVM7WUFBRSxVQUFVLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7UUFDdkUsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssU0FBUztZQUFFLFVBQVUsQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUE7UUFFL0YsTUFBTSxVQUFVLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUN4RSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQTtJQUMxQixDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDckYsQ0FBQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsTUFBTSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDbEUsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx5QkFBaUIsQ0FBQyxDQUFBO0lBQzlELE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO0lBRXpCLElBQUksQ0FBQztRQUNILE1BQU0saUJBQWlCLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDN0MsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDckYsQ0FBQztBQUNILENBQUMifQ==
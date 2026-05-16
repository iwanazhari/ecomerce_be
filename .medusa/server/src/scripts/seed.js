"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = seedWaterproData;
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
async function seedWaterproData({ container }) {
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const link = container.resolve(utils_1.ContainerRegistrationKeys.LINK);
    const storeModuleService = container.resolve(utils_1.Modules.STORE);
    const salesChannelModuleService = container.resolve(utils_1.Modules.SALES_CHANNEL);
    const fulfillmentModuleService = container.resolve(utils_1.Modules.FULFILLMENT);
    // ── Store & Sales Channel ──────────────────────────────────────────
    logger.info("Seeding store data...");
    const [store] = await storeModuleService.listStores();
    let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
        name: "Waterpro",
    });
    if (!defaultSalesChannel.length) {
        const { result: salesChannelResult } = await (0, core_flows_1.createSalesChannelsWorkflow)(container).run({
            input: {
                salesChannelsData: [{ name: "Waterpro" }],
            },
        });
        defaultSalesChannel = salesChannelResult;
    }
    await (0, core_flows_1.updateStoresWorkflow)(container).run({
        input: {
            selector: { id: store.id },
            update: {
                default_sales_channel_id: defaultSalesChannel[0].id,
            },
        },
    });
    logger.info("Store data seeded.");
    // ── Region (Indonesia, IDR) ─────────────────────────────────────────
    logger.info("Seeding region data...");
    const existingRegions = await container.resolve(utils_1.ContainerRegistrationKeys.QUERY).graph({
        entity: "region",
        fields: ["id"],
        filters: { name: "Indonesia" },
    });
    let region;
    if (existingRegions.data?.length) {
        region = existingRegions.data[0];
        logger.info("Region already exists.");
    }
    else {
        const { result: regionResult } = await (0, core_flows_1.createRegionsWorkflow)(container).run({
            input: {
                regions: [
                    {
                        name: "Indonesia",
                        currency_code: "idr",
                        countries: ["id"],
                        payment_providers: ["pp_system_default"],
                    },
                ],
            },
        });
        region = regionResult[0];
        logger.info("Region seeded.");
    }
    // ── Tax Region ──────────────────────────────────────────────────────
    logger.info("Seeding tax region...");
    const existingTaxRegions = await container.resolve(utils_1.ContainerRegistrationKeys.QUERY).graph({
        entity: "tax_region",
        fields: ["id"],
        filters: { country_code: "id" },
    });
    if (!existingTaxRegions.data?.length) {
        await (0, core_flows_1.createTaxRegionsWorkflow)(container).run({
            input: [{ country_code: "id", provider_id: "tp_system" }],
        });
        logger.info("Tax region seeded.");
    }
    else {
        logger.info("Tax region already exists.");
    }
    // ── Stock Location ──────────────────────────────────────────────────
    logger.info("Seeding stock location...");
    const existingStockLocations = await container.resolve(utils_1.ContainerRegistrationKeys.QUERY).graph({
        entity: "stock_location",
        fields: ["id"],
        filters: { name: "Waterpro Warehouse" },
    });
    let stockLocation;
    if (existingStockLocations.data?.length) {
        stockLocation = existingStockLocations.data[0];
        logger.info("Stock location already exists.");
    }
    else {
        const { result: stockLocationResult } = await (0, core_flows_1.createStockLocationsWorkflow)(container).run({
            input: {
                locations: [
                    {
                        name: "Waterpro Warehouse",
                        address: {
                            city: "Jakarta",
                            country_code: "ID",
                            address_1: "Jl. Industri Raya",
                        },
                    },
                ],
            },
        });
        stockLocation = stockLocationResult[0];
        logger.info("Stock location seeded.");
    }
    await (0, core_flows_1.updateStoresWorkflow)(container).run({
        input: {
            selector: { id: store.id },
            update: { default_location_id: stockLocation.id },
        },
    });
    await (0, core_flows_1.linkSalesChannelsToStockLocationWorkflow)(container).run({
        input: {
            id: stockLocation.id,
            add: [defaultSalesChannel[0].id],
        },
    });
    logger.info("Stock location seeded.");
    // ── Shipping Profile ────────────────────────────────────────────────
    logger.info("Seeding shipping profile...");
    let shippingProfile = await fulfillmentModuleService.listShippingProfiles({
        type: "default",
    });
    if (!shippingProfile.length) {
        const { result: shippingProfileResult } = await (0, core_flows_1.createShippingProfilesWorkflow)(container).run({
            input: {
                data: [{ name: "Default Shipping Profile", type: "default" }],
            },
        });
        shippingProfile = shippingProfileResult;
    }
    // Fulfillment set & service zone
    const existingFulfillmentSets = await container.resolve(utils_1.ContainerRegistrationKeys.QUERY).graph({
        entity: "fulfillment_set",
        fields: ["id"],
        filters: { name: "Waterpro Delivery" },
    });
    let fulfillmentSet;
    if (existingFulfillmentSets.data?.length) {
        fulfillmentSet = existingFulfillmentSets.data[0];
        // Fetch with relations for service_zone
        const fs = await container.resolve(utils_1.ContainerRegistrationKeys.QUERY).graph({
            entity: "fulfillment_set",
            fields: ["id", "name", "service_zones.id", "service_zones.name"],
            filters: { id: fulfillmentSet.id },
        });
        fulfillmentSet = fs.data?.[0] ?? fulfillmentSet;
        logger.info("Fulfillment set already exists.");
    }
    else {
        fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
            name: "Waterpro Delivery",
            type: "shipping",
            service_zones: [
                {
                    name: "Indonesia",
                    geo_zones: [{ country_code: "id", type: "country" }],
                },
            ],
        });
        logger.info("Fulfillment set seeded.");
    }
    await link.create({
        [utils_1.Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
        [utils_1.Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    });
    await link.create({
        [utils_1.Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
        [utils_1.Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });
    await (0, core_flows_1.createShippingOptionsWorkflow)(container).run({
        input: [
            {
                name: "Reguler",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[0].id,
                shipping_profile_id: shippingProfile[0].id,
                type: {
                    label: "Reguler",
                    description: "Pengiriman 2-3 hari",
                    code: "reguler",
                },
                prices: [
                    { currency_code: "idr", amount: 15000 },
                    { region_id: region.id, amount: 15000 },
                ],
                rules: [
                    { attribute: "enabled_in_store", value: "true", operator: "eq" },
                    { attribute: "is_return", value: "false", operator: "eq" },
                ],
            },
            {
                name: "Express",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[0].id,
                shipping_profile_id: shippingProfile[0].id,
                type: {
                    label: "Express",
                    description: "Pengiriman 24 jam",
                    code: "express",
                },
                prices: [
                    { currency_code: "idr", amount: 35000 },
                    { region_id: region.id, amount: 35000 },
                ],
                rules: [
                    { attribute: "enabled_in_store", value: "true", operator: "eq" },
                    { attribute: "is_return", value: "false", operator: "eq" },
                ],
            },
        ],
    });
    logger.info("Shipping profile seeded.");
    // ── Publishable API Key ─────────────────────────────────────────────
    logger.info("Seeding publishable API key...");
    const { data } = await container.resolve(utils_1.ContainerRegistrationKeys.QUERY).graph({
        entity: "api_key",
        fields: ["id"],
        filters: { type: "publishable" },
    });
    let publishableApiKey = data?.[0];
    if (!publishableApiKey) {
        const { result } = await (0, core_flows_1.createApiKeysWorkflow)(container).run({
            input: {
                api_keys: [
                    { title: "Waterpro API", type: "publishable", created_by: "" },
                ],
            },
        });
        publishableApiKey = result[0];
    }
    if (publishableApiKey) {
        await (0, core_flows_1.linkSalesChannelsToApiKeyWorkflow)(container).run({
            input: { id: publishableApiKey.id, add: [defaultSalesChannel[0].id] },
        });
    }
    logger.info("API key seeded.");
    // ── Product Categories ──────────────────────────────────────────────
    logger.info("Seeding product categories...");
    const queryRunner = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
    const existingCategories = await queryRunner.graph({
        entity: "product_category",
        fields: ["id", "name", "handle"],
    });
    const categoryNames = [
        "Air Minum",
        "Air Mineral",
        "Air Kemasan Galon",
        "Aksesoris",
    ];
    const existingHandles = new Set((existingCategories.data ?? []).map((c) => c.name.toLowerCase().replace(/\s+/g, "-")));
    const categoriesToCreate = categoryNames
        .filter((name) => !existingHandles.has(name.toLowerCase().replace(/\s+/g, "-")))
        .map((name) => ({
        name,
        is_active: true,
        handle: name.toLowerCase().replace(/\s+/g, "-"),
    }));
    let categoryResult = [];
    if (categoriesToCreate.length > 0) {
        const { result } = await (0, core_flows_1.createProductCategoriesWorkflow)(container).run({
            input: { product_categories: categoriesToCreate },
        });
        categoryResult = result;
        logger.info(`${categoriesToCreate.length} new categories seeded.`);
    }
    else {
        logger.info("All categories already exist.");
    }
    // Fetch all categories (existing + newly created)
    const allCategories = (await queryRunner.graph({
        entity: "product_category",
        fields: ["id", "name", "handle"],
    }));
    const allCategoryMap = new Map((allCategories.data ?? []).map((c) => [c.name, c]));
    const categoryResultMerged = [
        ...categoryResult,
        ...(allCategories.data ?? []),
    ];
    // ── Products ────────────────────────────────────────────────────────
    logger.info("Seeding products...");
    // Check existing products
    const existingProducts = await queryRunner.graph({
        entity: "product",
        fields: ["id", "title", "handle"],
    });
    const existingProductHandles = new Set((existingProducts.data ?? []).map((p) => p.handle));
    const findCategoryId = (name) => {
        const cat = allCategoryMap.get(name);
        if (!cat)
            throw new Error(`Category "${name}" not found`);
        return cat.id;
    };
    const productDefinitions = [
        {
            title: "Air Mineral 600ml",
            handle: "air-mineral-600ml",
            category_ids: [findCategoryId("Air Mineral")],
            description: "Air mineral alami dalam kemasan 600ml. Praktis dibawa kemana-mana.",
            weight: 650,
            images: [{ url: "https://picsum.photos/seed/water600/800/800" }],
            options: [{ title: "Ukuran", values: ["600ml"] }],
            variants: [
                {
                    title: "600ml",
                    sku: "WATER-600ML",
                    options: { Ukuran: "600ml" },
                    prices: [{ currency_code: "idr", amount: 3000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Air Mineral 1500ml",
            handle: "air-mineral-1500ml",
            category_ids: [findCategoryId("Air Mineral")],
            description: "Air mineral alami dalam kemasan 1500ml. Cocok untuk kebutuhan sehari-hari.",
            weight: 1550,
            images: [{ url: "https://picsum.photos/seed/water1500/800/800" }],
            options: [{ title: "Ukuran", values: ["1500ml"] }],
            variants: [
                {
                    title: "1500ml",
                    sku: "WATER-1500ML",
                    options: { Ukuran: "1500ml" },
                    prices: [{ currency_code: "idr", amount: 5000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Air Mineral 19L (Galon)",
            handle: "air-mineral-galon-19l",
            category_ids: [findCategoryId("Air Kemasan Galon")],
            description: "Air mineral berkualitas dalam kemasan galon 19 liter. Tersedia layanan antar isi ulang.",
            weight: 19000,
            images: [{ url: "https://picsum.photos/seed/watergalon/800/800" }],
            options: [{ title: "Ukuran", values: ["19L"] }],
            variants: [
                {
                    title: "19L",
                    sku: "WATER-GALON-19L",
                    options: { Ukuran: "19L" },
                    prices: [{ currency_code: "idr", amount: 20000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Paket Air Mineral 6x600ml",
            handle: "paket-air-mineral-6x600ml",
            category_ids: [findCategoryId("Air Mineral")],
            description: "Paket hemat air mineral 6 botol @600ml. Ideal untuk acara dan kegiatan outdoor.",
            weight: 4000,
            images: [{ url: "https://picsum.photos/seed/waterpack/800/800" }],
            options: [{ title: "Paket", values: ["6x600ml"] }],
            variants: [
                {
                    title: "6x600ml",
                    sku: "WATER-PACK-6X600",
                    options: { Paket: "6x600ml" },
                    prices: [{ currency_code: "idr", amount: 15000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Dispenser Air Galon",
            handle: "dispenser-air-galon",
            category_ids: [findCategoryId("Aksesoris")],
            description: "Dispenser untuk galon 19L dengan fitur hot & cold. Kualitas premium.",
            weight: 5000,
            images: [{ url: "https://picsum.photos/seed/dispenser/800/800" }],
            options: [{ title: "Tipe", values: ["Hot & Cold", "Normal"] }],
            variants: [
                {
                    title: "Hot & Cold",
                    sku: "DISPENSER-HC",
                    options: { Tipe: "Hot & Cold" },
                    prices: [{ currency_code: "idr", amount: 850000 }],
                    manage_inventory: true,
                },
                {
                    title: "Normal",
                    sku: "DISPENSER-NORMAL",
                    options: { Tipe: "Normal" },
                    prices: [{ currency_code: "idr", amount: 350000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Galon Kosong 19L",
            handle: "galon-kosong-19l",
            category_ids: [findCategoryId("Air Kemasan Galon")],
            description: "Galon kosong 19 liter untuk isi ulang air mineral. Material food-grade.",
            weight: 1500,
            images: [{ url: "https://picsum.photos/seed/galonempty/800/800" }],
            options: [{ title: "Ukuran", values: ["19L"] }],
            variants: [
                {
                    title: "19L",
                    sku: "GALON-EMPTY-19L",
                    options: { Ukuran: "19L" },
                    prices: [{ currency_code: "idr", amount: 50000 }],
                    manage_inventory: true,
                },
            ],
        },
    ];
    const productsToCreate = productDefinitions
        .filter((p) => !existingProductHandles.has(p.handle))
        .map((p) => ({
        ...p,
        status: utils_1.ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile[0].id,
        sales_channels: [{ id: defaultSalesChannel[0].id }],
    }));
    if (productsToCreate.length > 0) {
        await (0, core_flows_1.createProductsWorkflow)(container).run({
            input: { products: productsToCreate },
        });
        logger.info(`${productsToCreate.length} new products seeded.`);
    }
    else {
        logger.info("All products already exist.");
    }
    // ── Inventory Levels ────────────────────────────────────────────────
    logger.info("Seeding inventory levels...");
    const { data: inventoryItems } = await container.resolve(utils_1.ContainerRegistrationKeys.QUERY).graph({
        entity: "inventory_item",
        fields: ["id"],
    });
    const existingInventory = await container.resolve(utils_1.ContainerRegistrationKeys.QUERY).graph({
        entity: "inventory_level",
        fields: ["id", "inventory_item_id", "location_id"],
    });
    const existingInventoryKeys = new Set((existingInventory.data ?? []).map((inv) => `${inv.inventory_item_id}:${inv.location_id}`));
    const inventoryLevelsToCreate = inventoryItems
        .filter((item) => !existingInventoryKeys.has(`${item.id}:${stockLocation.id}`))
        .map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 1000,
        inventory_item_id: item.id,
    }));
    if (inventoryLevelsToCreate.length > 0) {
        await (0, core_flows_1.createInventoryLevelsWorkflow)(container).run({
            input: { inventory_levels: inventoryLevelsToCreate },
        });
        logger.info(`${inventoryLevelsToCreate.length} inventory levels seeded.`);
    }
    else {
        logger.info("All inventory levels already exist.");
    }
    logger.info("✅ Waterpro seed completed!");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY3JpcHRzL3NlZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFzQkEsbUNBc2hCQztBQTNpQkQscURBSW1DO0FBQ25DLDREQWNxQztBQUV0QixLQUFLLFVBQVUsZ0JBQWdCLENBQUMsRUFBRSxTQUFTLEVBQVk7SUFDcEUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQ0FBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuRSxNQUFNLElBQUksR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9ELE1BQU0sa0JBQWtCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUQsTUFBTSx5QkFBeUIsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMzRSxNQUFNLHdCQUF3QixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXhFLHNFQUFzRTtJQUN0RSxNQUFNLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDckMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sa0JBQWtCLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDdEQsSUFBSSxtQkFBbUIsR0FBRyxNQUFNLHlCQUF5QixDQUFDLGlCQUFpQixDQUFDO1FBQzFFLElBQUksRUFBRSxVQUFVO0tBQ2pCLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxNQUFNLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFFLEdBQUcsTUFBTSxJQUFBLHdDQUEyQixFQUN0RSxTQUFTLENBQ1YsQ0FBQyxHQUFHLENBQUM7WUFDSixLQUFLLEVBQUU7Z0JB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
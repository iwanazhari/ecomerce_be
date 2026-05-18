"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = seedWaterproData;
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
/**
 * Seed data for Waterpro — based on actual products from filterairwaterpro.com
 * Includes: admin user with SUPER_ADMIN role, categories, products, inventory, shipping, etc.
 */
async function seedWaterproData({ container }) {
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const link = container.resolve(utils_1.ContainerRegistrationKeys.LINK);
    const storeModuleService = container.resolve(utils_1.Modules.STORE);
    const salesChannelModuleService = container.resolve(utils_1.Modules.SALES_CHANNEL);
    const fulfillmentModuleService = container.resolve(utils_1.Modules.FULFILLMENT);
    const authModuleService = container.resolve(utils_1.Modules.AUTH);
    const userService = container.resolve(utils_1.Modules.USER);
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
    // ── Admin User (SUPER_ADMIN) ────────────────────────────────────────
    logger.info("Seeding admin user...");
    const adminEmail = "admin@waterpro.id";
    const adminPassword = "supersecret";
    try {
        const existingUsers = await userService.listUsers({ email: adminEmail });
        if (!existingUsers.length) {
            // Create user
            const user = await userService.createUsers({
                email: adminEmail,
                first_name: "Admin",
                last_name: "Waterpro",
            });
            // Create auth identity with password
            await authModuleService.createAuthIdentities({
                provider_identities: [
                    {
                        provider: "emailpass",
                        entity_id: adminEmail,
                        provider_metadata: {
                            password: adminPassword,
                        },
                    },
                ],
                app_metadata: {
                    user_id: user.id,
                },
            });
            // Assign SUPER_ADMIN role via RBAC
            const rbacRoleService = container.resolve(utils_1.Modules.RBAC);
            const query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
            // Use query to find super_admin role
            const { data: roles } = await query.graph({
                entity: "role",
                fields: ["id", "name"],
                filters: { name: "super_admin" },
            });
            if (roles && roles.length > 0) {
                // Use link module to assign role
                const link = container.resolve(utils_1.ContainerRegistrationKeys.LINK);
                await link.create({
                    [utils_1.Modules.USER]: { user_id: user.id },
                    [utils_1.Modules.RBAC]: { role_id: roles[0].id },
                });
            }
            logger.info("✅ Admin user created: admin@waterpro.id / supersecret");
        }
        else {
            logger.info("Admin user already exists.");
        }
    }
    catch (error) {
        logger.warn("Could not seed admin user: " + error);
    }
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
    logger.info("Stock location linked.");
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
    // Categories matching Waterpro product types (from filterairwaterpro.com)
    const categoryDefs = [
        { name: "Kran Filter", handle: "kran-filter" },
        { name: "Cartridge Filter", handle: "cartridge-filter" },
        { name: "RO System", handle: "ro-system" },
        { name: "Shower Filter", handle: "shower-filter" },
        { name: "UF System", handle: "uf-system" },
    ];
    const existingHandles = new Set((existingCategories.data ?? []).map((c) => c.handle));
    const categoriesToCreate = categoryDefs
        .filter((cat) => !existingHandles.has(cat.handle))
        .map((cat) => ({
        name: cat.name,
        handle: cat.handle,
        is_active: true,
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
    const allCategoryMap = new Map((allCategories.data ?? []).map((c) => [c.handle, c]));
    const findCategoryId = (handle) => {
        const cat = allCategoryMap.get(handle);
        if (!cat)
            throw new Error(`Category handle "${handle}" not found`);
        return cat.id;
    };
    // ── Products (based on filterairwaterpro.com catalog) ──────────────
    logger.info("Seeding products...");
    const existingProducts = await queryRunner.graph({
        entity: "product",
        fields: ["id", "title", "handle"],
    });
    const existingProductHandles = new Set((existingProducts.data ?? []).map((p) => p.handle));
    // Product definitions matching Waterpro catalog
    // Images from Unsplash (stable CDN, water/filter themed)
    const productDefinitions = [
        {
            title: "Filter Air Kran Mini WFK-25 Waterpro",
            handle: "filter-kran-mini-wfk-25",
            category_handle: "kran-filter",
            description: "Filter air kran mini Waterpro WFK-25. Mudah dipasang langsung di kran dapur atau wastafel. Menghilangkan klorin, bau, dan partikel kasar. Compact dan praktis untuk kebutuhan sehari-hari.",
            weight: 200,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Model", values: ["Mini"] }],
            variants: [
                {
                    title: "Mini",
                    sku: "WFK-25",
                    options: { Model: "Mini" },
                    prices: [{ currency_code: "idr", amount: 30000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air Kran Dapur Fleskibel WFK-32 Waterpro",
            handle: "filter-kran-dapur-fleskibel-wfk-32",
            category_handle: "kran-filter",
            description: "Filter air kran dapur fleskibel Waterpro WFK-32. Dilengkapi selang fleksibel untuk kemudahan penggunaan. Menyaring klorin, lumpur, dan partikel halus. Cocok untuk dapur rumah tangga.",
            weight: 350,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Model", values: ["Fleskibel"] }],
            variants: [
                {
                    title: "Fleskibel",
                    sku: "WFK-32",
                    options: { Model: "Fleskibel" },
                    prices: [{ currency_code: "idr", amount: 25000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air Kran Wastafel WFK 45 - PCA Waterpro",
            handle: "filter-kran-wastafel-wfk-45-pca",
            category_handle: "kran-filter",
            description: "Filter air kran wastafel Waterpro WFK 45 dengan 4 media filter PCA. Menyaring klorin, bau, rasa tidak sedap, dan partikel halus. Desain compact untuk wastafel.",
            weight: 500,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Tipe", values: ["PCA"] }],
            variants: [
                {
                    title: "PCA",
                    sku: "WFK-45-PCA",
                    options: { Tipe: "PCA" },
                    prices: [{ currency_code: "idr", amount: 98500 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air Kran Wastafel WFK 45 - Stainless Steel Waterpro",
            handle: "filter-kran-wastafel-wfk-45-stainless",
            category_handle: "kran-filter",
            description: "Filter air kran wastafel Waterpro WFK 45 dengan body Stainless Steel premium. Dilengkapi 4 media filter untuk penyaringan maksimal. Tahan karat dan tahan lama.",
            weight: 700,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Material", values: ["Stainless Steel"] }],
            variants: [
                {
                    title: "Stainless Steel",
                    sku: "WFK-45-SS",
                    options: { Material: "Stainless Steel" },
                    prices: [{ currency_code: "idr", amount: 153500 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air Cartridge UF PVDF 10 Inch Waterpro",
            handle: "filter-cartridge-uf-pvdf-10-inch",
            category_handle: "cartridge-filter",
            description: "Cartridge filter UF PVDF 10 inch Waterpro. Membran Ultrafiltrasi PVDF berkualitas tinggi untuk penyaringan partikel halus, bakteri, dan virus. Cocok untuk sistem filtrasi rumah tangga.",
            weight: 800,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Ukuran", values: ["10 Inch"] }],
            variants: [
                {
                    title: "10 Inch",
                    sku: "UF-PVDF-10",
                    options: { Ukuran: "10 Inch" },
                    prices: [{ currency_code: "idr", amount: 185000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air Cartridge UF PVDF 20 Inch Waterpro",
            handle: "filter-cartridge-uf-pvdf-20-inch",
            category_handle: "cartridge-filter",
            description: "Cartridge filter UF PVDF 20 inch Waterpro. Kapasitas lebih besar untuk kebutuhan komersial atau rumah tangga besar. Membran PVDF premium untuk filtrasi optimal.",
            weight: 1500,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Ukuran", values: ["20 Inch"] }],
            variants: [
                {
                    title: "20 Inch",
                    sku: "UF-PVDF-20",
                    options: { Ukuran: "20 Inch" },
                    prices: [{ currency_code: "idr", amount: 369000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air Minum RO Mini Q Waterpro with PAC + 100 GPD RO",
            handle: "filter-air-minum-ro-mini-q-waterpro",
            category_handle: "ro-system",
            description: "Filter air minum RO Mini Q Waterpro dengan teknologi Reverse Osmosis 100 GPD. Dilengkapi PAC (Powder Activated Carbon) untuk penyaringan maksimal. Menghasilkan air minum murni, bebas kontaminan, aman untuk dikonsumsi langsung. Cocok untuk rumah tangga kecil hingga menengah.",
            weight: 5000,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Kapasitas", values: ["100 GPD"] }],
            variants: [
                {
                    title: "100 GPD",
                    sku: "RO-MINI-Q-100",
                    options: { Kapasitas: "100 GPD" },
                    prices: [{ currency_code: "idr", amount: 2500000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air Shower Special Waterpro",
            handle: "filter-air-shower-special-waterpro",
            category_handle: "shower-filter",
            description: "Filter air shower special Waterpro. Menyaring klorin, karat, dan partikel halus dari air mandi. Melindungi kulit dan rambut dari efek buruk klorin. Mudah dipasang di shower head.",
            weight: 400,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Tipe", values: ["Special"] }],
            variants: [
                {
                    title: "Special",
                    sku: "SHOWER-SPECIAL",
                    options: { Tipe: "Special" },
                    prices: [{ currency_code: "idr", amount: 151000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air UF PVDF Mini Jumbo 10 Inch Waterpro",
            handle: "filter-uf-pvdf-mini-jumbo-10-inch",
            category_handle: "uf-system",
            description: "Filter air UF PVDF Mini Jumbo 10 inch Waterpro. Sistem Ultrafiltrasi dengan membran PVDF berkualitas tinggi. Menyaring bakteri, virus, dan partikel mikro. Ideal untuk rumah tangga dengan kebutuhan air bersih harian.",
            weight: 3000,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Ukuran", values: ["10 Inch"] }],
            variants: [
                {
                    title: "10 Inch",
                    sku: "UF-PVDF-MJ-10",
                    options: { Ukuran: "10 Inch" },
                    prices: [{ currency_code: "idr", amount: 740000 }],
                    manage_inventory: true,
                },
            ],
        },
        {
            title: "Filter Air UF PVDF Jumbo 20 Inch Waterpro",
            handle: "filter-uf-pvdf-jumbo-20-inch",
            category_handle: "uf-system",
            description: "Filter air UF PVDF Jumbo 20 inch Waterpro. Kapasitas besar untuk kebutuhan komersial atau rumah tangga besar. Membran PVDF premium untuk penyaringan bakteri, virus, dan partikel mikro secara maksimal.",
            weight: 5000,
            images: [
                {
                    url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=800&fit=crop",
                },
            ],
            options: [{ title: "Ukuran", values: ["20 Inch"] }],
            variants: [
                {
                    title: "20 Inch",
                    sku: "UF-PVDF-JUMBO-20",
                    options: { Ukuran: "20 Inch" },
                    prices: [{ currency_code: "idr", amount: 1479500 }],
                    manage_inventory: true,
                },
            ],
        },
    ];
    const productsToCreate = productDefinitions
        .filter((p) => !existingProductHandles.has(p.handle))
        .map((p) => ({
        ...p,
        category_ids: [findCategoryId(p.category_handle)],
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
        stocked_quantity: 100,
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
    logger.info("✅ Waterpro seed completed successfully!");
    logger.info("📧 Admin login: admin@waterpro.id / supersecret");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY3JpcHRzL3NlZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUEwQkEsbUNBNnJCQztBQXR0QkQscURBSW1DO0FBQ25DLDREQWNxQztBQUVyQzs7O0dBR0c7QUFDWSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsRUFBRSxTQUFTLEVBQVk7SUFDcEUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQ0FBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuRSxNQUFNLElBQUksR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9ELE1BQU0sa0JBQWtCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUQsTUFBTSx5QkFBeUIsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMzRSxNQUFNLHdCQUF3QixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3hFLE1BQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUQsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFcEQsc0VBQXNFO0lBQ3RFLE1BQU0sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUN0RCxJQUFJLG1CQUFtQixHQUFHLE1BQU0seUJBQXlCLENBQUMsaUJBQWlCLENBQUM7UUFDMUUsSUFBSSxFQUFFLFVBQVU7S0FDakIsQ0FBQyxDQUFDO0lBRUgs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
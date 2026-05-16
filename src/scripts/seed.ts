import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Seed data for Waterpro — based on actual products from filterairwaterpro.com
 * Includes: admin user with SUPER_ADMIN role, categories, products, inventory, shipping, etc.
 */
export default async function seedWaterproData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const storeModuleService = container.resolve(Modules.STORE);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const authModuleService = container.resolve(Modules.AUTH);
  const userService = container.resolve(Modules.USER);

  // ── Store & Sales Channel ──────────────────────────────────────────
  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Waterpro",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container,
    ).run({
      input: {
        salesChannelsData: [{ name: "Waterpro" }],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoresWorkflow(container).run({
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
      const rbacRoleService = container.resolve(Modules.RBAC);
      const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
      
      // Use query to find super_admin role
      const { data: roles } = await query.graph({
        entity: "role",
        fields: ["id", "name"],
        filters: { name: "super_admin" },
      });

      if (roles && roles.length > 0) {
        // Use link module to assign role
        const link = container.resolve(ContainerRegistrationKeys.LINK);
        await link.create({
          [Modules.USER]: { user_id: user.id },
          [Modules.RBAC]: { role_id: roles[0].id },
        });
      }

      logger.info("✅ Admin user created: admin@waterpro.id / supersecret");
    } else {
      logger.info("Admin user already exists.");
    }
  } catch (error) {
    logger.warn("Could not seed admin user: " + error);
  }

  // ── Region (Indonesia, IDR) ─────────────────────────────────────────
  logger.info("Seeding region data...");
  const existingRegions = await (
    container.resolve(ContainerRegistrationKeys.QUERY) as any
  ).graph({
    entity: "region",
    fields: ["id"],
    filters: { name: "Indonesia" },
  });

  let region: any;
  if (existingRegions.data?.length) {
    region = existingRegions.data[0];
    logger.info("Region already exists.");
  } else {
    const { result: regionResult } = await createRegionsWorkflow(container).run(
      {
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
      },
    );
    region = regionResult[0];
    logger.info("Region seeded.");
  }

  // ── Tax Region ──────────────────────────────────────────────────────
  logger.info("Seeding tax region...");
  const existingTaxRegions = await (
    container.resolve(ContainerRegistrationKeys.QUERY) as any
  ).graph({
    entity: "tax_region",
    fields: ["id"],
    filters: { country_code: "id" },
  });

  if (!existingTaxRegions.data?.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "id", provider_id: "tp_system" }],
    });
    logger.info("Tax region seeded.");
  } else {
    logger.info("Tax region already exists.");
  }

  // ── Stock Location ──────────────────────────────────────────────────
  logger.info("Seeding stock location...");
  const existingStockLocations = await (
    container.resolve(ContainerRegistrationKeys.QUERY) as any
  ).graph({
    entity: "stock_location",
    fields: ["id"],
    filters: { name: "Waterpro Warehouse" },
  });

  let stockLocation: any;
  if (existingStockLocations.data?.length) {
    stockLocation = existingStockLocations.data[0];
    logger.info("Stock location already exists.");
  } else {
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
      container,
    ).run({
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

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_location_id: stockLocation.id },
    },
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
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
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [{ name: "Default Shipping Profile", type: "default" }],
        },
      });
    shippingProfile = shippingProfileResult;
  }

  // Fulfillment set & service zone
  const existingFulfillmentSets = await (
    container.resolve(ContainerRegistrationKeys.QUERY) as any
  ).graph({
    entity: "fulfillment_set",
    fields: ["id"],
    filters: { name: "Waterpro Delivery" },
  });

  let fulfillmentSet: any;
  if (existingFulfillmentSets.data?.length) {
    fulfillmentSet = existingFulfillmentSets.data[0];
    const fs = await (
      container.resolve(ContainerRegistrationKeys.QUERY) as any
    ).graph({
      entity: "fulfillment_set",
      fields: ["id", "name", "service_zones.id", "service_zones.name"],
      filters: { id: fulfillmentSet.id },
    });
    fulfillmentSet = fs.data?.[0] ?? fulfillmentSet;
    logger.info("Fulfillment set already exists.");
  } else {
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
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  await createShippingOptionsWorkflow(container).run({
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
  const { data } = await (
    container.resolve(ContainerRegistrationKeys.QUERY) as any
  ).graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  });
  let publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Waterpro API", type: "publishable", created_by: "" },
        ],
      },
    });
    publishableApiKey = result[0];
  }

  if (publishableApiKey) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: publishableApiKey.id, add: [defaultSalesChannel[0].id] },
    });
  }
  logger.info("API key seeded.");

  // ── Product Categories ──────────────────────────────────────────────
  logger.info("Seeding product categories...");
  const queryRunner = container.resolve(ContainerRegistrationKeys.QUERY) as any;

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

  const existingHandles = new Set(
    (existingCategories.data ?? []).map((c: any) => c.handle),
  );

  const categoriesToCreate = categoryDefs
    .filter((cat) => !existingHandles.has(cat.handle))
    .map((cat) => ({
      name: cat.name,
      handle: cat.handle,
      is_active: true,
    }));

  let categoryResult: any[] = [];
  if (categoriesToCreate.length > 0) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: categoriesToCreate },
    });
    categoryResult = result;
    logger.info(`${categoriesToCreate.length} new categories seeded.`);
  } else {
    logger.info("All categories already exist.");
  }

  // Fetch all categories (existing + newly created)
  const allCategories = (await queryRunner.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
  })) as { data?: Array<{ id: string; name: string; handle: string }> };
  const allCategoryMap = new Map<
    string,
    { id: string; name: string; handle: string }
  >((allCategories.data ?? []).map((c) => [c.handle, c]));

  const findCategoryId = (handle: string): string => {
    const cat = allCategoryMap.get(handle);
    if (!cat) throw new Error(`Category handle "${handle}" not found`);
    return cat.id;
  };

  // ── Products (based on filterairwaterpro.com catalog) ──────────────
  logger.info("Seeding products...");

  const existingProducts = await queryRunner.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
  });
  const existingProductHandles = new Set(
    (existingProducts.data ?? []).map((p: any) => p.handle),
  );

  // Product definitions matching Waterpro catalog
  // Images from Unsplash (stable CDN, water/filter themed)
  const productDefinitions = [
    {
      title: "Filter Air Kran Mini WFK-25 Waterpro",
      handle: "filter-kran-mini-wfk-25",
      category_handle: "kran-filter",
      description:
        "Filter air kran mini Waterpro WFK-25. Mudah dipasang langsung di kran dapur atau wastafel. Menghilangkan klorin, bau, dan partikel kasar. Compact dan praktis untuk kebutuhan sehari-hari.",
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
      description:
        "Filter air kran dapur fleskibel Waterpro WFK-32. Dilengkapi selang fleksibel untuk kemudahan penggunaan. Menyaring klorin, lumpur, dan partikel halus. Cocok untuk dapur rumah tangga.",
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
      description:
        "Filter air kran wastafel Waterpro WFK 45 dengan 4 media filter PCA. Menyaring klorin, bau, rasa tidak sedap, dan partikel halus. Desain compact untuk wastafel.",
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
      description:
        "Filter air kran wastafel Waterpro WFK 45 dengan body Stainless Steel premium. Dilengkapi 4 media filter untuk penyaringan maksimal. Tahan karat dan tahan lama.",
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
      description:
        "Cartridge filter UF PVDF 10 inch Waterpro. Membran Ultrafiltrasi PVDF berkualitas tinggi untuk penyaringan partikel halus, bakteri, dan virus. Cocok untuk sistem filtrasi rumah tangga.",
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
      description:
        "Cartridge filter UF PVDF 20 inch Waterpro. Kapasitas lebih besar untuk kebutuhan komersial atau rumah tangga besar. Membran PVDF premium untuk filtrasi optimal.",
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
      description:
        "Filter air minum RO Mini Q Waterpro dengan teknologi Reverse Osmosis 100 GPD. Dilengkapi PAC (Powder Activated Carbon) untuk penyaringan maksimal. Menghasilkan air minum murni, bebas kontaminan, aman untuk dikonsumsi langsung. Cocok untuk rumah tangga kecil hingga menengah.",
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
      description:
        "Filter air shower special Waterpro. Menyaring klorin, karat, dan partikel halus dari air mandi. Melindungi kulit dan rambut dari efek buruk klorin. Mudah dipasang di shower head.",
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
      description:
        "Filter air UF PVDF Mini Jumbo 10 inch Waterpro. Sistem Ultrafiltrasi dengan membran PVDF berkualitas tinggi. Menyaring bakteri, virus, dan partikel mikro. Ideal untuk rumah tangga dengan kebutuhan air bersih harian.",
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
      description:
        "Filter air UF PVDF Jumbo 20 inch Waterpro. Kapasitas besar untuk kebutuhan komersial atau rumah tangga besar. Membran PVDF premium untuk penyaringan bakteri, virus, dan partikel mikro secara maksimal.",
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
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile[0].id,
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    }));

  if (productsToCreate.length > 0) {
    await createProductsWorkflow(container).run({
      input: { products: productsToCreate },
    });
    logger.info(`${productsToCreate.length} new products seeded.`);
  } else {
    logger.info("All products already exist.");
  }

  // ── Inventory Levels ────────────────────────────────────────────────
  logger.info("Seeding inventory levels...");
  const { data: inventoryItems } = await (
    container.resolve(ContainerRegistrationKeys.QUERY) as any
  ).graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const existingInventory = await (
    container.resolve(ContainerRegistrationKeys.QUERY) as any
  ).graph({
    entity: "inventory_level",
    fields: ["id", "inventory_item_id", "location_id"],
  });

  const existingInventoryKeys = new Set(
    (existingInventory.data ?? []).map(
      (inv: any) => `${inv.inventory_item_id}:${inv.location_id}`,
    ),
  );

  const inventoryLevelsToCreate = inventoryItems
    .filter(
      (item: { id: string }) =>
        !existingInventoryKeys.has(`${item.id}:${stockLocation.id}`),
    )
    .map((item: { id: string }) => ({
      location_id: stockLocation.id,
      stocked_quantity: 100,
      inventory_item_id: item.id,
    }));

  if (inventoryLevelsToCreate.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryLevelsToCreate },
    });
    logger.info(`${inventoryLevelsToCreate.length} inventory levels seeded.`);
  } else {
    logger.info("All inventory levels already exist.");
  }

  logger.info("✅ Waterpro seed completed successfully!");
  logger.info("📧 Admin login: admin@waterpro.id / supersecret");
}

/** Run setup() ONCE from the editor. Needs script properties ADMIN_PHONE (10 digits) and ADMIN_PASSWORD (min 8 chars). */
function setup() {
  const p = PropertiesService.getScriptProperties(),
    phone = phone_(p.getProperty("ADMIN_PHONE")),
    pw = p.getProperty("ADMIN_PASSWORD");
  if (!/^[6-9]\d{9}$/.test(phone) || !pw || pw.length < 8)
    throw new Error(
      "Set script properties ADMIN_PHONE (10 digits) and ADMIN_PASSWORD (min 8 chars) first.",
    );
  const roles = new RoleRepo(),
    users = new UserRepo();
  [
    new OutletRepo(),
    new MenuRepo(),
    new OfferRepo(),
    new OrderRepo(),
    new PaymentRepo(),
  ].forEach((r) => r.sheet);
  Settings.all();
  if (!roles.all().length)
    [
      ["CUSTOMER", "Customer"],
      ["MERCHANT", "Merchant"],
      ["ADMIN", "Admin"],
    ].forEach((r) => roles.insert({ id: ROLES[r[0]], code: r[0], name: r[1] }));
  if (!users.all().some((u) => u.roleId === ROLES.ADMIN))
    users.insert({
      name: "Admin",
      phone,
      roleId: ROLES.ADMIN,
      pwHash: Auth.hash(pw, phone),
      status: "active",
    });
  const seedResult = seedJindRestaurants();
  return "Setup complete. " + seedResult + " Log in with ADMIN_PHONE + ADMIN_PASSWORD from the Admin link, then delete ADMIN_PASSWORD from script properties.";
}
/** Optional: creates a demo merchant (phone 9999900001 / password demo1234) with menu + offer, already active. Delete the rows later. */
function seedDemo() {
  const r = AuthService.register({
    role: "MERCHANT",
    name: "Demo Owner",
    phone: "9999900001",
    password: "demo1234",
    outlet: {
      name: "Sharma Chai & Parathe",
      cuisine: "North Indian, Chai",
      address: "Hansi Road, Jind",
      description: "Garam chai, aloo parathe and more.",
    },
  });
  const o = new OutletRepo().all().pop();
  new OutletRepo().update(o.id, { status: "active" });
  [
    ["Masala Chai", "Chai", 20, true],
    ["Aloo Paratha", "Parathe", 60, true],
    ["Paneer Paratha", "Parathe", 90, true],
    ["Chicken Roll", "Rolls", 120, false],
  ].forEach((m) =>
    new MenuRepo().insert({
      outletId: o.id,
      name: m[0],
      description: "Fresh and hot",
      category: m[1],
      price: m[2],
      veg: m[3],
      photo1: "",
      photo2: "",
      available: true,
    }),
  );
  new OfferRepo().insert({
    outletId: o.id,
    title: "10% off on first order",
    code: "CHAI10",
    type: "PERCENT",
    value: 10,
    maxOff: 50,
    minOrder: 100,
    validTill: "",
    active: true,
  });
  CacheService.getScriptCache().remove("outlets");
  return "Demo ready: " + o.id;
}

/** Optional: adds illustrative Jind sample listings, menus, and offers. Safe to run more than once. */
function seedJindRestaurants() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("No active Google Sheet. Open the target Sheet and launch Apps Script from Extensions → Apps Script.");
  Logger.log("Seeding spreadsheet: " + spreadsheet.getName() + " | " + spreadsheet.getUrl());
  const samples = [
    { name: "Jind Junction Dhaba", cuisine: "North Indian, Dhaba", address: "Safidon Road, Jind", description: "Demo listing · Punjabi dhaba favourites", menu: [["Dal Makhani", "Main Course", 180, true], ["Shahi Paneer", "Main Course", 220, true], ["Butter Roti", "Breads", 25, true], ["Jeera Rice", "Rice", 130, true]] },
    { name: "Hansi Road Kitchen", cuisine: "North Indian, Chinese", address: "Hansi Road, Jind", description: "Demo listing · Everyday meals and quick bites", menu: [["Chole Bhature", "Breakfast", 120, true], ["Veg Fried Rice", "Chinese", 150, true], ["Chilli Paneer", "Chinese", 210, true], ["Masala Chaach", "Beverages", 45, true]] },
    { name: "Desi Tadka Family Restaurant", cuisine: "North Indian, Thali", address: "Rohtak Road, Jind", description: "Demo listing · Homestyle thalis and curries", menu: [["Special Veg Thali", "Thali", 190, true], ["Kadai Paneer", "Main Course", 230, true], ["Dal Fry", "Main Course", 150, true], ["Tandoori Roti", "Breads", 20, true]] },
    { name: "Jind Spice House", cuisine: "Mughlai, North Indian", address: "Gohana Road, Jind", description: "Demo listing · Rich gravies and grill items", menu: [["Chicken Curry", "Main Course", 260, false], ["Paneer Tikka", "Starters", 220, true], ["Chicken Seekh Kebab", "Starters", 240, false], ["Rumali Roti", "Breads", 25, true]] },
    { name: "Tandoor Express Jind", cuisine: "Tandoori, Rolls", address: "Patiala Chowk, Jind", description: "Demo listing · Fresh-from-the-tandoor snacks", menu: [["Paneer Tikka Roll", "Rolls", 140, true], ["Chicken Tikka Roll", "Rolls", 170, false], ["Afghani Chaap", "Starters", 210, true], ["Masala Lassi", "Beverages", 70, true]] },
    { name: "Chai Chaupal", cuisine: "Tea, Snacks", address: "Rani Talab Road, Jind", description: "Demo listing · Chai, parathas and evening snacks", menu: [["Adrak Chai", "Chai", 25, true], ["Aloo Paratha", "Parathe", 75, true], ["Paneer Pakora", "Snacks", 110, true], ["Bread Pakora", "Snacks", 50, true]] },
    { name: "Haryanvi Rasoi", cuisine: "Haryanvi, North Indian", address: "Bhiwani Road, Jind", description: "Demo listing · A sample of local-style comfort food", menu: [["Bajra Roti with Ghee", "Local Special", 55, true], ["Kadhi Pakora", "Main Course", 150, true], ["Seasonal Saag", "Main Course", 160, true], ["Sweet Lassi", "Beverages", 65, true]] },
    { name: "Pizza Point Jind", cuisine: "Pizza, Italian", address: "Urban Estate, Jind", description: "Demo listing · Pizzas and sides", menu: [["Margherita Pizza", "Pizza", 179, true], ["Farmhouse Pizza", "Pizza", 279, true], ["Garlic Bread", "Sides", 99, true], ["Pasta Alfredo", "Pasta", 199, true]] },
    { name: "Rolls & Bowls", cuisine: "Rolls, Chinese", address: "Near Bus Stand, Jind", description: "Demo listing · Filling rolls and rice bowls", menu: [["Paneer Kathi Roll", "Rolls", 139, true], ["Egg Roll", "Rolls", 119, false], ["Chicken Rice Bowl", "Bowls", 189, false], ["Veg Hakka Noodles", "Chinese", 149, true]] },
    { name: "Sweet Crumbs Bakery", cuisine: "Bakery, Desserts", address: "Gohana Road, Jind", description: "Demo listing · Cakes, bakes and desserts", menu: [["Chocolate Pastry", "Desserts", 75, true], ["Veg Puff", "Bakery", 35, true], ["Garlic Bread", "Bakery", 90, true], ["Brownie", "Desserts", 95, true]] },
    { name: "South Spice Cafe", cuisine: "South Indian", address: "Defence Colony, Jind", description: "Demo listing · Dosas, idli and filter coffee", menu: [["Masala Dosa", "South Indian", 130, true], ["Idli Sambar", "South Indian", 90, true], ["Medu Vada", "South Indian", 85, true], ["Filter Coffee", "Beverages", 55, true]] },
    { name: "Burger Adda Jind", cuisine: "Burgers, Fast Food", address: "Railway Road, Jind", description: "Demo listing · Burgers, fries and shakes", menu: [["Aloo Tikki Burger", "Burgers", 99, true], ["Crispy Chicken Burger", "Burgers", 159, false], ["Peri Peri Fries", "Sides", 99, true], ["Cold Coffee", "Beverages", 89, true]] },
  ];
  const offerSpecs = [
    { title: "10% off up to ₹50", code: "JIND10", type: "PERCENT", value: 10, maxOff: 50, minOrder: 199 },
    { title: "₹40 off on orders above ₹299", code: "TASTY40", type: "FLAT", value: 40, maxOff: 0, minOrder: 299 },
    { title: "15% off up to ₹75", code: "FOOD15", type: "PERCENT", value: 15, maxOff: 75, minOrder: 249 },
    { title: "₹25 off on orders above ₹199", code: "LOCAL25", type: "FLAT", value: 25, maxOff: 0, minOrder: 199 },
  ];
  const outlets = new OutletRepo(), menus = new MenuRepo(), offers = new OfferRepo();
  let addedOutlets = 0, addedDishes = 0, addedOffers = 0;
  samples.forEach((sample, index) => {
    let outlet = outlets.all().find((o) => o.name === sample.name);
    if (!outlet) {
      outlet = outlets.insert({ ownerId: "DEMO-SEED", name: sample.name, description: sample.description, cuisine: sample.cuisine, address: sample.address, phone: "", photo: "", status: "active", isOpen: true, selfDelivery: true, deliveryFee: "", minOrder: 0, prepMins: 25, plan: "FREE", paidTill: "" });
      addedOutlets++;
    }
    const existingMenus = menus.all().filter((m) => m.outletId === outlet.id);
    sample.menu.forEach((dish) => {
      if (existingMenus.some((m) => m.name === dish[0])) return;
      menus.insert({ outletId: outlet.id, name: dish[0], category: dish[1], price: dish[2], veg: dish[3], description: "Sample menu item", photo1: "", photo2: "", available: true });
      addedDishes++;
    });
    if (index % 3 === 0) {
      const spec = offerSpecs[Math.floor(index / 3)];
      if (!offers.all().some((f) => f.outletId === outlet.id && f.code === spec.code)) {
        offers.insert(Object.assign({ outletId: outlet.id, validTill: "", active: true }, spec));
        addedOffers++;
      }
    }
  });
  CacheService.getScriptCache().remove("outlets");
  const result = "Jind demo seed ready: " + addedOutlets + " restaurants, " + addedDishes + " dishes, " + addedOffers + " offers added. Existing matching sample records were kept.";
  Logger.log(result + " Spreadsheet: " + spreadsheet.getUrl());
  Logger.log("Sheet row counts — Outlets: " + outlets.all().length + ", MenuItems: " + menus.all().length + ", Offers: " + offers.all().length);
  return result;
}

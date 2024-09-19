import { Hono } from "hono";
import { db } from "../db/index.js";
import { orders, products, users } from "../db/schema.js";
import { cors } from "hono/cors";
import { desc, eq } from "drizzle-orm";

const app = new Hono();
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
  })
);

app.get("/api/done", (c) => {
  return c.json({ text: "done" });
});

type UserData = {
  fullName: string;
  phone: string;
  createdAt: string;
};

type ProductData = {
  productName: string;
  productCode: string;
  productPrice: string;
  createdAt: string;
};

type OrderData = {
  orderNumber: number;
  productCode: string;
  quantity: number;
  total: number;
  userId: number;
  productId: number;
  userNumber: string;
  createdAt: string;
};

type ItemProps = {
  userData: UserData;
  products: ProductData;
  orders: OrderData;
};

app.post("/api/store", async (c) => {
  const data = await c.req.json();

  const filteredData = data
    .filter(
      (elem: ItemProps, index:number, arr: ItemProps[]) =>
        index ===
        arr.findIndex(
          (t) =>
            // console.log(elem.products)
            t.userData.fullName === elem.userData.fullName &&
            t.products.productCode === elem.products.productCode &&
            t.userData.phone === elem.userData.phone &&
            t.products.productName === elem.products.productName &&
            t.products.productPrice === elem.products.productPrice &&
            t.userData.createdAt === elem.userData.createdAt
        )
    )
    .map((item: ItemProps) => ({
      fullName: item.userData.fullName,
      phone: item.userData.phone,
      createdAt: item.userData.createdAt,
      productPrice: item.products.productPrice,
      productName: item.products.productName,
      productCode: item.products.productCode,
      orderNumber: item.orders.orderNumber,
      quantity: item.orders.quantity,
      createdAtOrder: item.orders.createdAt,
    }));

  try {
    for (const data of filteredData) {
    
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.phone, data.phone));

      if (existingUser.length === 0) {
        await db.insert(users).values({
          fullName: data.fullName,
          phone: data.phone,
          createdAt: new Date(data.createdAt),
        });
      }

      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.productCode, data.productCode));

      if (existingProduct.length === 0) {
        await db.insert(products).values({
          productName: data.productName,
          productPrice: data.productPrice,
          productCode: data.productCode,
          createdAt: new Date(data.createdAt),
        });
      }

      const totalSpent = data.productPrice * data.quantity;

      const userId = await db
        .select()
        .from(users)
        .where(eq(users.phone, data.phone))
        .then((id) => id[0]?.id);

      const existingOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNo, data.orderNumber));

      if (existingOrder.length === 0) {
        await db.insert(orders).values({
          orderNo: data.orderNumber,
          productCode: data.productCode,
          quantity: data.quantity,
          productPrice: data.productPrice.toString(),
          total: totalSpent,
          userId: userId,
          createdAt: new Date(data.createdAt),
        });
      }
    }

    return c.json({ message: "Successfully inserted" }, 200);
  } catch (error) {
    console.error("Error inserting data", error);
    return c.json("Server Error", 500);
  }
});

app.get("/api/data", async (c) => {
  try {
    const product = await db
      .select({
        productName: products.productName,
        productPrice: products.productPrice,
        userName: users.fullName,
        quantity: orders.quantity,
        total: orders.total,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productCode, products.productCode))
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.total))
      .limit(3);

    return c.json(product);
  } catch (error) {
    console.error("Error retrieving data",error)
    return c.json({message: "Unable to retrieve data"},500)
  }
});
export default app;

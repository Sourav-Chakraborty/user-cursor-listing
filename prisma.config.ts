try {
  require("dotenv").config();
} catch (e) {
  // Dotenv is not available or not needed (e.g. in Render production environment where variables are already injected)
}

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
};

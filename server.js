import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URL = "mongodb://127.0.0.1:27017";

const dbName = "books";
const client = new MongoClient(MONGO_URL);

let db;

// Connect to MongoDB
client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

// Create a new book
// POST: http://localhost:7000/api/v1/books
app.post("/api/v1/books", async (req, res, next) => {
  try {
    const book = req.body;

    const result = await db.collection("books").insertOne(book);

    res.status(201).json({
      message: "Book created successfully",
      data: {
        _id: result.insertedId,
        ...book,
      },
    });
  } catch (err) {
    err.status = 500;
    err.message = "Failed to create book";
    next(err);
  }
});

// Get all books
// GET: http://localhost:7000/api/v1/books
// GET: http://localhost:7000/api/v1/books?category=Fiction
app.get("/api/v1/books", async (req, res, next) => {
  try {
    const { category } = req.query;

    const query = category ? { category } : {};

    const books = await db.collection("books").find(query).toArray();

    res.status(200).json({
      message: "Books retrieved successfully",
      data: books,
    });
  } catch (err) {
    err.status = 500;
    err.message = "Failed to retrieve books";
    next(err);
  }
});

// Get one book by ID
// GET: http://localhost:7000/api/v1/books/:id
app.get("/api/v1/books/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      const error = new Error("Invalid book ID");
      error.status = 400;
      throw error;
    }

    const book = await db
      .collection("books")
      .findOne({ _id: new ObjectId(id) });

    if (!book) {
      const error = new Error("Book not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      message: "Book retrieved successfully",
      data: book,
    });
  } catch (err) {
    next(err);
  }
});

// Update one book
// PUT: http://localhost:7000/api/v1/books/:id
app.put("/api/v1/books/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBook = req.body;

    if (!ObjectId.isValid(id)) {
      const error = new Error("Invalid book ID");
      error.status = 400;
      throw error;
    }

    const result = await db
      .collection("books")
      .updateOne({ _id: new ObjectId(id) }, { $set: updatedBook });

    if (result.matchedCount === 0) {
      const error = new Error("Book not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      message: "Book updated successfully",
      data: {
        _id: id,
        ...updatedBook,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Delete one book
// DELETE: http://localhost:7000/api/v1/books/:id
app.delete("/api/v1/books/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      const error = new Error("Invalid book ID");
      error.status = 400;
      throw error;
    }

    const result = await db
      .collection("books")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      const error = new Error("Book not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      message: "Book deleted successfully",
      data: {
        _id: id,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 404 route handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    message,
  });
});

const PORT = 7000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
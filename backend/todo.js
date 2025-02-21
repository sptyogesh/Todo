const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const bcrypt = require("bcrypt");
const cors = require("cors");
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./todo.db', (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        console.log("Connected to SQLite database.");
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        created_at BIGINT,
        updated_at BIGINT,
        last_login BIGINT
    )`, (err) => {
        if (err) {
            console.error("Error creating users table:", err);
        } else {
            console.log("Users table is ready.");
        }
    });
    db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        title VARCHAR(255),
        description TEXT,
        completed BOOLEAN DEFAULT 0,
        completed_at BIGINT,
        priority INTEGER CHECK(priority >= 1 AND priority <= 5),
        due_date DATE,
        created_at BIGINT,
        updated_at BIGINT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error("Error creating todos table:", err);
        } else {
            console.log("Todos table is ready.");
        }
    });

    db.run("CREATE INDEX IF NOT EXISTS idx_user_id ON todos (user_id);", (err) => {
        if (err) {
            console.error("Error creating index on user_id:", err);
        } else {
            console.log("Index on user_id created.");
        }
    });

    db.run("CREATE INDEX IF NOT EXISTS idx_priority ON todos (priority);", (err) => {
        if (err) {
            console.error("Error creating index on priority:", err);
        } else {
            console.log("Index on priority created.");
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS todo_history (
            id INTEGER PRIMARY KEY,
            todo_id INTEGER,
            changed_at BIGINT,
            changed_by INTEGER,
            field_changed VARCHAR(255),
            old_value TEXT,
            new_value TEXT,
            reason TEXT,
            FOREIGN KEY(todo_id) REFERENCES todos(id) ON DELETE CASCADE,
            FOREIGN KEY(changed_by) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error("Error creating todo_history table:", err);
        } else {
            console.log("Todo history table is ready.");
        }
    });
    
});

const getCurrentTimestamp = () => {
    const now = new Date();
    const istOffset = 5.5 * 60;
    const utc = now.getTime() + now.getTimezoneOffset() * 60000; // Get UTC time
    const istTime = new Date(utc + istOffset * 60000); // Convert to IST
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    const hours = String(istTime.getHours()).padStart(2, '0');
    const minutes = String(istTime.getMinutes()).padStart(2, '0');
    const seconds = String(istTime.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

const saltRounds = 10;
const hashPassword = async (password) => {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const isEmailUnique = (email, callback) => {
    db.get("SELECT email FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
            console.error("Error checking email uniqueness:", err);
            callback(err, false);
        } else {
            callback(null, row ? false : true); 
        }
    });
};
app.get("/users", (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(404).send("Error retrieving users.");
        }
        res.send(rows); 
    });
});

app.post("/users", async (req, res) => {
    const { name, email, password } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).send("Invalid email format.");
    }

    isEmailUnique(email, async (err, isUnique) => {
        if (err) {
            return res.status(500).send("Error checking email uniqueness.");
        }

        if (!isUnique) {
            return res.status(400).send("Email already exists.");
        }

        try {
            const hashedPassword = await hashPassword(password);
            const created_at = getCurrentTimestamp(); 
            
            db.run(
                "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)",
                [name, email, hashedPassword, created_at],
                function (err) {
                    if (err) {
                        console.error("Error inserting user:", err);
                        return res.status(500).send("Error adding user.");
                    }
                    res.send({
                        id: this.lastID,
                        name,
                        email,
                        created_at,
                    });
                }
            );
        } catch (err) {
            console.error("Error hashing password:", err);
            return res.status(500).send("Error hashing password.");
        }
    });
});

const updateLastLogin = (email, last_login, res) => {
    db.run(
        "UPDATE users SET last_login = ? WHERE email = ?",
        [last_login, email],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).send("Error updating last login.");
            }
            if (this.changes === 0) {
                return res.status(404).send("User not found.");
            }
        }
    );
};

app.get("/users/:email", (req, res) => {
    const email = req.params.email;
    const last_login = getCurrentTimestamp();
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving user.");
        }
        if (!row) {
            return res.status(404).send("User not found.");
        }
        updateLastLogin(email, last_login, res);
        res.send({
            message: `last login Date & Time is ${last_login}`,
            user: row,
        });
    });
});

app.put("/users/:email", async (req, res) => {
    const { name, password, email: newEmail } = req.body;
    const oldEmail = req.params.email;
    const updated_at = getCurrentTimestamp();
    let updateFields = [];
    let updateValues = [];

    if (newEmail && !isValidEmail(newEmail)) {
        return res.status(400).send("Invalid email format.");
    }

    if (newEmail && newEmail !== oldEmail) {
        isEmailUnique(newEmail, async (err, isUnique) => {
            if (err) {
                return res.status(500).send("Error checking email uniqueness.");
            }

            if (!isUnique) {
                return res.status(400).send("Email already exists.");
            }

            if (name) {
                updateFields.push("name = ?");
                updateValues.push(name);
            }

            if (password) {
                try {
                    const hashedPassword = await hashPassword(password);
                    updateFields.push("password = ?");
                    updateValues.push(hashedPassword);
                } catch (err) {
                    console.error("Error hashing password:", err);
                    return res.status(500).send("Error hashing password.");
                }
            }

            if (newEmail) {
                updateFields.push("email = ?");
                updateValues.push(newEmail);
            }

            updateFields.push("updated_at = ?");
            updateValues.push(updated_at);

            updateValues.push(oldEmail);

            const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE email = ?`;

            db.run(sql, updateValues, function (err) {
                if (err) {
                    console.error("Error updating user:", err);
                    return res.status(500).send("Error updating user.");
                }
                if (this.changes === 0) {
                    return res.status(404).send("User not found.");
                }
                res.send({
                    message: "User updated successfully",
                    updated_at,
                });
            });
        });
    } else {
        if (name) {
            updateFields.push("name = ?");
            updateValues.push(name);
        }

        if (password) {
            try {
                const hashedPassword = await hashPassword(password);
                updateFields.push("password = ?");
                updateValues.push(hashedPassword);
            } catch (err) {
                console.error("Error hashing password:", err);
                return res.status(500).send("Error hashing password.");
            }
        }

        updateFields.push("updated_at = ?");
        updateValues.push(updated_at);

        updateValues.push(oldEmail);

        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE email = ?`;

        db.run(sql, updateValues, function (err) {
            if (err) {
                console.error("Error updating user:", err);
                return res.status(500).send("Error updating user.");
            }
            if (this.changes === 0) {
                return res.status(404).send("User not found.");
            }
            res.send({
                message: "User updated successfully",
                updated_at,
            });
        });
    }
});

app.delete("/users/:email", (req, res) => {
    const email = req.params.email;

    db.run("DELETE FROM users WHERE email = ?", [email], function (err) {
        if (err) {
            console.error(err);
            return res.status(404).send("Error deleting user.");
        }
        if (this.changes === 0) {
            return res.status(404).send("User not found.");
        }
        res.send({ message: "User deleted successfully" });
    });
});

function logTodoHistory(todo_id, changed_by, reason, field_changed, oldValue, newValue) {
    const changed_at = getCurrentTimestamp();

    // ✅ Convert empty or space-only reason to NULL before inserting into DB
    const sanitizedReason = reason && reason.trim() !== "" ? reason.trim() : null;

    const sql = `INSERT INTO todo_history (todo_id, changed_at, changed_by, field_changed, old_value, new_value, reason) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [todo_id, changed_at, changed_by, field_changed, oldValue, newValue, sanitizedReason], (err) => {
        if (err) {
            console.error("Error logging todo history:", err);
        }
    });
}


app.post("/todos", (req, res) => {
    const { user_id, title, description, completed, priority, due_date } = req.body;
    const created_at = getCurrentTimestamp();

    if (!user_id || !title) {
        return res.status(400).send("User ID and title are required.");
    }
    if (priority < 1 || priority > 5) {
        return res.status(400).send("Priority must be between 1 and 5.");
    }
    if (due_date && isNaN(Date.parse(due_date))) {
        return res.status(400).send("Invalid due date format.");
    }

    db.run(
        "INSERT INTO todos (user_id, title, description, completed, priority, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user_id, title, description, completed, priority, due_date, created_at],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).send("Error adding todo.");
            }

            const changeReason = "Created new todo";
            const todo_id = this.lastID;
            logTodoHistory(todo_id, user_id, changeReason, null, title);

            res.send({
                todoid: todo_id,
                user_id,
                title,
                description,
                completed,
                priority,
                due_date,
                created_at,
            });
        }
    );
});

app.get("/todos/:id", (req, res) => {
    const todo_id = req.params.id;

    db.get("SELECT * FROM todos WHERE id = ?", [todo_id], (err, row) => {
        if (err) {
            console.error("Error retrieving todo:", err);
            return res.status(500).send("Error retrieving todo.");
        }
        if (!row) {
            return res.status(404).send("Todo not found.");
        }
        res.send(row);
    });
});


app.get("/:user_id/todos", (req, res) => {
    const user_id = req.params.user_id;

    if (!user_id) {
        return res.status(400).send("User ID is required.");
    }

    db.all("SELECT * FROM todos WHERE user_id = ?", [user_id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving todos.");
        }
        res.send(rows);
    });
});


app.get("/todos", (req, res) => {
    db.all("SELECT * FROM todos", [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving todos.");
        }
        res.send(rows);
    });
});




app.get("/todos/:id/history", (req, res) => {
    const todo_id = req.params.id;

    db.all("SELECT * FROM todo_history WHERE todo_id = ?", [todo_id], (err, rows) => {
        if (err) {
            console.error("Error retrieving todo history:", err);
            return res.status(500).send("Error retrieving todo history.");
        }

        if (!rows || rows.length === 0) {
            return res.status(404).send("No history found for this todo.");
        }
        const sanitizedHistory = rows.map(entry => ({
            ...entry,
            reason: entry.reason && entry.reason.trim() !== "" ? entry.reason.trim() : null
        }));

        res.send(sanitizedHistory);
    });
});


app.put("/:id/todos", (req, res) => {
    const todo_id = req.params.id;
    const { title, description, completed, priority, due_date, user_id, reason } = req.body;
    const updated_at = getCurrentTimestamp();
    const completed_at = completed ? getCurrentTimestamp() : null; 

    if (!user_id || !reason) {
        return res.status(400).send("User ID and reason are required.");
    }

    db.get("SELECT * FROM todos WHERE id = ?", [todo_id], (err, todo) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving todo.");
        }
        if (!todo) {
            return res.status(404).send("Todo not found.");
        }

        const updateFields = [];
        const updateValues = [];
        const changes = [];

        if (title && title !== todo.title) {
            updateFields.push("title = ?");
            updateValues.push(title);
            changes.push({ field: "title", oldValue: todo.title, newValue: title });
        }
        if (description && description !== todo.description) {
            updateFields.push("description = ?");
            updateValues.push(description);
            changes.push({ field: "description", oldValue: todo.description, newValue: description });
        }
        if (completed !== undefined && completed !== todo.completed) {
            updateFields.push("completed = ?");
            updateValues.push(completed);
            updateFields.push("completed_at = ?"); 
            updateValues.push(completed ? updated_at : null);
            changes.push({ field: "completed", oldValue: todo.completed, newValue: completed });
        }
        if (priority !== undefined && priority !== todo.priority) {
            updateFields.push("priority = ?");
            updateValues.push(priority);
            changes.push({ field: "priority", oldValue: todo.priority, newValue: priority });
        }
        if (due_date !== undefined && due_date !== todo.due_date) {
            updateFields.push("due_date = ?");
            updateValues.push(due_date);
            changes.push({ field: "due_date", oldValue: todo.due_date, newValue: due_date });
        }

        if (changes.length === 0) {
            return res.status(400).send("No fields provided to update or no changes detected.");
        }

        updateFields.push("updated_at = ?");
        updateValues.push(updated_at);
        updateValues.push(todo_id);
        const sql = `UPDATE todos SET ${updateFields.join(', ')} WHERE id = ?`;

        db.run(sql, updateValues, function (err) {
            if (err) {
                console.error(err);
                return res.status(500).send("Error updating todo.");
            }

            changes.forEach(change => {
                logTodoHistory(todo_id, user_id, reason, change.field, change.oldValue, change.newValue);
            });

            res.send({ message: "Todo updated successfully", updated_at, completed_at });
        });
    });
});


app.delete("/todos/:id", (req, res) => {
    const todo_id = req.params.id;
    const deleted_at = getCurrentTimestamp();

    db.get("SELECT * FROM todos WHERE id = ?", [todo_id], (err, todo) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving todo.");
        }
        if (!todo) {
            return res.status(404).send("Todo not found.");
        }

        const changeReason = "Deleted todo";
        logTodoHistory(todo_id, req.body.user_id, changeReason, JSON.stringify(todo), null);

        // Delete the todo
        db.run("DELETE FROM todos WHERE id = ?", [todo_id], function (err) {
            if (err) {
                console.error(err);
                return res.status(500).send("Error deleting todo.");
            }
            res.send({ message: "Todo deleted successfully" });
        });
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));

const express = require("express");
const dotenv = require("dotenv");

const app = express();
dotenv.config({ path: "./env/.env" });

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));

app.set("view engine", "ejs");

const bcryptjs = require("bcryptjs");

const session = require("express-session");
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

const connection = require("./database/db");

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const user = req.body.user;
  const name = req.body.name;
  const password = req.body.pass;
  console.log("BODY", req.body);
  let passwordHash = await bcryptjs.hash(password, 12);

  connection.query(
    "INSERT INTO users SET ?",
    {
      user: user,
      name: name,
      password: passwordHash,
    },
    async (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.render("register", {
          alert: true,
          alertTitle: "Registration",
          alertMessage: "Successfull Registration",
          alertIcon: "success",
          showConfirmButton: false,
          timer: 1500,
          ruta: "",
        });
      }
    }
  );
});

app.post("/auth", async (req, res) => {
  const user = req.body.user;
  const pass = req.body.pass;
  let passwordHash = await bcryptjs.hash(pass, 12);
  if (user && pass) {
    connection.query(
      "SELECT * FROM users WHERE user = ?",
      [user],
      async (error, results) => {
        if (
          results.length === 0 ||
          !(await bcryptjs.compare(pass, results[0].password))
        ) {
          res.render("login", {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Usuario y/o password incorrectas",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else {
          req.session.loggedin = true;
          req.session.name = results[0].name;
          res.render("login", {
            alert: true,
            alertTitle: "Conexión exitosa",
            alertMessage: `Login correcto estimado: ${results[0].name}`,
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: "",
          });
        }
      }
    );
  } else {
    res.render("login", {
      alert: true,
      alertTitle: "Advertencia",
      alertMessage: "Por favor ingrese un usuario y contraseña",
      alertIcon: "warning",
      showConfirmButton: true,
      timer: 15000,
      ruta: "login",
    });
  }
});

app.get("/", (req, res) => {
  if (req.session.loggedin) {
    res.render("index", {
      login: true,
      name: req.session.name,
    });
  } else {
    res.render("index", {
      login: false,
      name: "Debe iniciar sesión",
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(3000, (req, res) => {
  console.log("SERVER RUNNING IN http://localhost:3000");
});

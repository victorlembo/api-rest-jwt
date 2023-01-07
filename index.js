const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const JWTSecret = "djkshahjksdajksdhasjkdhasjkdhasjkdhasjkd";

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function auth(req, res, next) {
  const authToken = req.headers["authorization"];

  if (authToken != undefined) {
    const bearer = authToken.split(" ");
    var token = bearer[1];

    jwt.verify(token, JWTSecret, (err, data) => {
      if (err) {
        res.status(401);
        res.json({ err: "Token inválido!" });
      } else {
        req.token = token;
        req.loggedUser = { id: data.id, email: data.email };

        next();
      }
    });
  } else {
    res.status(401);
    res.json({ err: "Token inválido!" });
  }
}

var FAKEDB = {
  games: [
    {
      id: 23,
      title: "Call of Duty MW",
      year: 2019,
      price: 60,
    },

    {
      id: 65,
      title: "Sea of Thieves",
      year: 2018,
      price: 40,
    },
    {
      id: 2,
      title: "Minecraft",
      year: 2019,
      price: 20,
    },
  ],
  users: [
    {
      id: 1,
      name: "User Example",
      email: "user@example.com",
      password: 1234,
    },

    {
      id: 2,
      name: "User Example2",
      email: "user@example2.com",
      password: 5678,
    },
  ],
};

app.get("/games", auth, (req, res) => {
  var HATEOAS = [
    {
      href: "http://localhost:3000/game/0",
      method: "GET",
      rel: "get_game",
    },
    {
      href: "http://localhost:3000/game/0",
      method: "DELETE",
      rel: "delete_game",
    },
    {
      href: "http://localhost:3000/auth",
      method: "POST",
      rel: "login",
    },
  ];

  res.statusCode = 200;
  res.json({ games: FAKEDB.games, _links: HATEOAS });
});

app.get("/game/:id", auth, (req, res) => {
  if (isNaN(req.params.id)) {
    res.sendStatus(400);
  } else {
    var id = parseInt(req.params.id);

    var HATEOAS = [
      {
        href: `http://localhost:3000/game/${id}`,
        method: "GET",
        rel: "get_game",
      },
      {
        href: `http://localhost:3000/game/${id}`,
        method: "DELETE",
        rel: "delete_game",
      },
      {
        href: `http://localhost:3000/game/${id}`,
        method: "PUT",
        rel: "edit_game",
      },
      {
        href: "http://localhost:3000/games",
        method: "GET",
        rel: "get_all_games",
      },
    ];
    var game = FAKEDB.games.find((g) => g.id == id);

    if (game != undefined) {
      res.statusCode = 200;
      res.json({ game, _links: HATEOAS });
    } else {
      res.sendStatus(404);
    }
  }
});

app.post("/game", auth, (req, res) => {
  var { title, price, year } = req.body;
  FAKEDB.games.push({ id: 34, title, price, year });
  res.sendStatus(200);
});

app.put("/game/:id", auth, (req, res) => {
  if (isNaN(req.params.id)) {
    res.sendStatus(400);
  } else {
    var id = parseInt(req.params.id);
    var game = FAKEDB.games.find((g) => g.id == id);

    if (game != undefined) {
      var { title, price, year } = req.body;
      if (title != undefined) {
        game.title = title;
      }
      if (price != undefined) {
        game.price = price;
      }
      if (year != undefined) {
        game.year = year;
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  }
});

app.delete("/game/:id", auth, (req, res) => {
  if (isNaN(req.params.id)) {
    res.sendStatus(400);
  } else {
    var id = parseInt(req.params.id);
    var index = FAKEDB.games.findIndex((g) => g.id == id);

    if (index == -1) {
      res.sendStatus(404);
    } else {
      FAKEDB.games.splice(index, 1);
      res.sendStatus(200);
    }
  }
});

app.post("/auth", (req, res) => {
  var { email, password } = req.body;

  if (email != undefined) {
    var user = FAKEDB.users.find((u) => u.email == email);
    if (user != undefined) {
      if (user.password == password) {
        jwt.sign(
          { id: user.id, email: user.email },
          JWTSecret,
          { expiresIn: "48h" },
          (err, token) => {
            if (err) {
              res.status(400);
              res.json({ err: "Falha interna" });
            } else {
              res.status(200);
              res.json({ token: token });
            }
          }
        );
      } else {
        res.status(401);
        res.json({ err: "  Credenciais inválidas!" });
      }
    } else {
      res.status(404);
      res.json({ err: "O E-mail enviado não existe na base de dados!" });
    }
  } else {
    res.status(400);
    res.send({ err: "O E-mail enviado é inválido" });
  }
});

app.listen(3000, () => {
  console.log("API rodando");
});

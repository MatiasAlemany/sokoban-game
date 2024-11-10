function forEachIn(object, action) {
    //iterate object property
    for (var property in object) {
      if (object.hasOwnProperty(property))
        action(property, object[property]);
    }
  }

  //#create dom element with javascript, nested dom element supported.
  function dom(name, attributes /*, children...*/) {
    var node = document.createElement(name);

    // Si se proporcionan atributos
    if (attributes) {
        for (let attrName in attributes) {
            // Si es "class", usa className directamente para mayor eficiencia
            if (attrName === "class") {
                node.className = attributes[attrName];
            } else {
                node.setAttribute(attrName, attributes[attrName]);
            }
        }
    }

    // Añadir los hijos (argumentos adicionales)
    for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];
        if (typeof child == "string") child = document.createTextNode(child);
        node.appendChild(child);
    }

    return node;
}

  //Event #1 registerEvent
  function registerEventHandler(node, event, handler) {
    if (typeof node.addEventListener == "function")
      node.addEventListener(event, handler, false); //browser concern #1
    else node.attachEvent("on" + event, handler);
  }
  function unregisterEventHandler(node, event, handler) {
    if (typeof node.removeEventListener == "function")
      node.removeEventListener(event, handler, false);
    else node.detachEvent("on" + event, handler);
  }

  //Event #2 event object eg. function(event){}
  function normalizeEvent(event) {
    if (!event.stopPropagation) {
      event.stopPropagation = function () {
        this.cancelBubble = true;
      };
      event.preventDefault = function () {
        this.returnValue = false;
      };
    }
    if (!event.stop)
      event.stop = function () {
        this.stopPropagation();
        this.preventDefault();
      };
    if (event.srcElement && !event.target) event.target = event.srcElement;
    if ((event.toElement || event.fromElement) && !event.relatedTarget)
      event.relatedTarget = event.toElement || event.fromElement;
    if (event.clientX != undefined && event.pageX == undefined) {
      event.pageX = event.clientX + document.body.scrollLeft;
      event.pageY = event.clientY + document.body.scrollTop;
    }
    if (event.type == "keypress")
      event.character = String.fromCharCode(
        event.charCode || event.keyCode
      );
    return event;
  }

  //Event #3 combines #1 and #2
  function addHandler(node, type, handler) {
    function wrapHandler(event) {
      handler(normalizeEvent(event || window.event)); //browser concern #2
    }
    registerEventHandler(node, type, wrapHandler);
    return { node: node, type: type, handler: wrapHandler };
  }
  function removeHandler(object) {
    unregisterEventHandler(object.node, object.type, object.handler);
  }

  const levels = [
    {
      boulders: 10,
      field: [
        "######  ##### ",
        "#    #  #   # ",
        "# 0  #### 0 # ",
        "# 0 @    0  # ",
        "#  #######0 # ",
        "####   ### ###",
        "       #     #",
        "       #0    #",
        "       #   0 #",
        "      ## 0   #",
        "      #*0 0  #",
        "      ########"
      ]
    },
    {
      boulders: 8,
      field: [
        "  #######     ",
        "###     ###   ",
        "#   0 #   #   ",
        "# #0 @ 0 #    ",
        "#   ##   #    ",
        "## #  0 #     ",
        "#    #   #    ",
        "# 0 ###  *#   ",
        "##   #     ###",
        " #######     #",
        "       #######"
      ]
    },
    {
      boulders: 6,
      field: [
        "     ######   ",
        "#####      ###",
        "#   # 0#     #",
        "# 0 @   0 #* #",
        "###   ##   # #",
        "  ###  # 0 # #",
        "   #    ##   #",
        "   # 0    ####",
        "   ########   "
      ]
    }
  ];
  

  var directions = new Dictionary({
    c: new Point(0, 0),
    n: new Point(0, -1),
    ne: new Point(1, -1),
    e: new Point(1, 0),
    se: new Point(1, 1),
    s: new Point(0, 1),
    sw: new Point(-1, 1),
    w: new Point(-1, 0),
    nw: new Point(-1, -1),
  });
  function Dictionary(startValues) {
    this.values = startValues || {};
  }
  Dictionary.prototype.store = function (name, value) {
    this.values[name] = value;
  };
  Dictionary.prototype.lookup = function (name) {
    return this.values[name];
  };
  Dictionary.prototype.contains = function (name) {
    return Object.prototype.propertyIsEnumerable.call(this.values, name);
  };
  Dictionary.prototype.each = function (action) {
    forEachIn(this.values, action);
  };
  Dictionary.prototype.names = function () {
    var names = [];
    this.each(function (name, value) {
      names.push(name);
    });
    return names;
  };

  function Point(x, y) {
    this.x = x;
    this.y = y;
  }

  Point.prototype.add = function (other) {
    return new Point(this.x + other.x, this.y + other.y);
  };

  //Asociando una imagen para su visualización en la interfaz del juego
  function Square(character, img) {
    this.img = img;
    const content = {
      "@": "player",
      "#": "wall",
      "*": "exit",
      " ": "empty",
      0: "boulder",
    }[character];

    if (content == null)
      throw new Error("Unrecognized character: '" + character + "'");
    this.setContent(content);
  }

  Square.prototype.setContent = function (content) {
    this.content = content;
    this.img.src = "img/" + content + ".png";
  };

  function SokobanField(level) {
    this.fieldDiv = dom("DIV", {class: "game-container", id: "mainContainer"});
    this.squares = [];
    this.bouldersToGo = level.boulders;

    for (var y = 0; y < level.field.length; y++) {
      const line = level.field[y],
        squareRow = [];
      for (var x = 0; x < line.length; x++) {
        const img = dom("IMG");
        this.fieldDiv.appendChild(img);
        squareRow.push(new Square(line.charAt(x), img));
        if (line.charAt(x) == "@") this.playerPos = new Point(x, y);
      }
      this.fieldDiv.appendChild(dom("BR"));
      this.squares.push(squareRow);
    }
  }

  SokobanField.prototype.status = function () {
    return (
      this.bouldersToGo +
      " boulder" +
      (this.bouldersToGo == 1 ? "" : "s") +
      " to go."
    );
  };
  SokobanField.prototype.won = function () {
     return this.bouldersToGo <= 0;
  };

  SokobanField.prototype.place = function (where) {
    where.appendChild(this.fieldDiv);
  };
  SokobanField.prototype.remove = function () {
    this.fieldDiv.parentNode.removeChild(this.fieldDiv);
  };

  SokobanField.prototype.move = function (direction) {
    const playerSquare = this.squares[this.playerPos.y][this.playerPos.x],
      targetPos = this.playerPos.add(direction),
      targetSquare = this.squares[targetPos.y][targetPos.x];
    console.log(targetSquare);
    

    //Condicionales dependiendo si hay boulders o espacios vacios.
    if (targetSquare.content == "boulder") {
      const pushPos = targetPos.add(direction),
        pushSquare = this.squares[pushPos.y][pushPos.x];
      if (pushSquare.content == "empty") {
        targetSquare.setContent("empty");
        pushSquare.setContent("boulder");
      } else if (pushSquare.content == "exit") {
        targetSquare.setContent("empty");
        this.bouldersToGo--;
      }
    }

    //Si hay boulder que empuje
    if (targetSquare.content == "empty")
    {
      playerSquare.setContent("empty");
      targetSquare.setContent("player");
      this.playerPos = targetPos;
    }
  };

  function method(object, name) {
    return function () {
      object[name].apply(object, arguments);
    };
  }

  function SokobanGame(levels, place) {
    this.levels = levels;
    let newGame = dom("BUTTON", null, "New game");
    addHandler(newGame, "click", method(this, "newGame"));
    let reset = dom("BUTTON", null, "Reset level");
    addHandler(reset, "click", method(this, "resetLevel"));
    this.status = dom("DIV", {class:"level-number"});
    this.container = dom(
      "DIV",
      {class:"principal-container"},
      dom("H1", null, "SOKOBAN"),
      dom("DIV", {class:"button-container"}, newGame, " ", reset),
      this.status
    );
    place.appendChild(this.container);
    addHandler(document, "keydown", method(this, "keyDown"));
    this.newGame();
  }

  SokobanGame.prototype.newGame = function () {
    this.level = 0;
    this.resetLevel();
  };
  SokobanGame.prototype.resetLevel = function () {
    if (this.field) this.field.remove();
    this.field = new SokobanField(this.levels[this.level]);
    this.field.place(this.container);
    this.updateStatus();
  };
  SokobanGame.prototype.updateStatus = function () {
    this.status.innerHTML =
      "Level " + (1 + this.level) + ": " + this.field.status();
  };

  let arrowKeyCodes = {
    37: new Point(-1, 0), //left
    38: new Point(0, -1), //up
    39: new Point(1, 0), //rigth
    40: new Point(0, 1), //down
  };

  SokobanGame.prototype.keyDown = function (event) {
    if (arrowKeyCodes.hasOwnProperty(event.keyCode)) {
      event.stop();

      this.field.move(arrowKeyCodes[event.keyCode]);
      this.updateStatus();
      if (this.field.won()) {
        if (this.level < this.levels.length - 1) {
          alert("Excellent! Going to the next level.");
          this.level++;
          this.resetLevel();
        } else {
          alert("You win! Game over.");
          this.newGame();
        }
      }
    }
  };
  new SokobanGame(levels, document.body);
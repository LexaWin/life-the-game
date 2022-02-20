// Размер ячейки
const cellSize = 10;
// Главный массив, в котором будет хранится текущее поколение
let currentGen;
// Будет хранить возвращаемое значение функции setInterval
// Нужен нам для останова игры
let timerId;


// Кнопка создания игры
const createButton = document.getElementById('create');
// Кнопка запуска игры
const startButton = document.getElementById('start');
// Кнопка останова игры
const stopButton = document.getElementById('stop');



// Поле с количеством ячеек по горизонтали
const widthInput = document.getElementById('game-field-width');
// Поле с количеством ячеек по вертикали
const heightInput = document.getElementById('game-field-height');
// Поле со скоростью игры
const speedInput = document.getElementById('game-speed');
// Поле со скоростью игры
const gameField = document.getElementById('game-field');
const context = gameField.getContext('2d');


// Ширина и длина игрового поля и скорость игры
let gameFieldWidth,
    gameFieldHeight,
    gameSpeed,
    cellsCount; // Общее количество ячеек.

// Создаем игру
createButton.onclick = () => {
  gameFieldWidth = +widthInput.value;
  gameFieldHeight = +heightInput.value;
  gameSpeed = +speedInput.value;
  // Вычислим общее количество ячеек
  cellsCount = gameFieldWidth * gameFieldHeight;

  if (gameFieldWidth > 0 && gameFieldHeight > 0 && gameSpeed >= 0) {
    createGame();
    document.getElementById('start').disabled = false;
  } else {
    alert(`Задан неверный размер игрового поля!
Укажите верные значения!
Ширина и высота игрового поля должны быть строго больше 0.
Скорость игры должна быть не меньше 0.`);
  }
};

// Создает игру
const createGame = () => {
  // Если вдруг пересоздаём игру после Game Over'а
  if (document.querySelector('h1')) document.querySelector('h1').innerHTML = '';

  // Устанавливаем размеры игрового поля
  gameField.width = gameFieldWidth * cellSize + 1;
  gameField.height = gameFieldHeight * cellSize + 1;

  // Рисуем сетку
  createGrid();

  // Инициализируем массив
  currentGen = Array(cellsCount).fill(false);
};

// Рисует сетку на игровом поле
const createGrid = () => {
  // Рисуем вертикальные линии
  for (let x = 0.5; x < gameField.width; x += cellSize) {
    context.moveTo(x, 0);
    context.lineTo(x, gameField.height);
  }

  // Рисуем горизонтальные линии
  for (let y = 0.5; y < gameField.height; y += cellSize) {
    context.moveTo(0, y);
    context.lineTo(gameField.width, y);
  }

  context.strokeStyle = '#eeeeee';
  context.stroke();
};

// Задает ячейки для первого поколения
gameField.onclick = (event) => {
  const cellId = getCellId(event);

  currentGen[cellId] = !currentGen[cellId];

  currentGen[cellId] ? reviveCell(cellId) : killCell(cellId);
};

// Возвращает номер ячейки, по которой кликнули
const getCellId = (event) => {
  const mouseX = event.pageX - gameField.offsetLeft;
  const mouseY = event.pageY - gameField.offsetTop;

  return Math.floor(mouseX / cellSize) +
    gameFieldWidth * Math.floor(mouseY / cellSize);
};

// "Убивает" ячейку (красит в белый)
killCell = (cellId) => {
  drawRect(cellId, '#ffffff');
};

// "Оживляет" ячейку (красит в красный)
reviveCell = (cellId) => {
  drawRect(cellId, '#ff0000');
};

// Рисует на игровом поле
const drawRect = (cellId, color) => {
  const x = cellId % gameFieldWidth * (cellSize) + 1;
  const y = Math.floor(cellId / gameFieldWidth) * (cellSize) + 1;
  
  context.fillStyle = color;
  context.fillRect(x, y, cellSize - 1, cellSize - 1);
};

// Запускает игру
startButton.onclick = () => {
  stopButton.disabled = false;

  startGame();
};

// Запускает игру
const startGame = () => {
  // Массив для обхода клеток, находящихся вокруг текущей ячейки
  // Содержит смещения относительно текущего индекса
  const diffs = [
    gameFieldWidth + 1,
    gameFieldWidth,
    gameFieldWidth - 1,
    1,
    -(gameFieldWidth + 1),
    -gameFieldWidth,
    -(gameFieldWidth - 1),
    -1
  ];

  // Для повышения производительности проверять будем только "живые" клетки
  // и те, которые находятся вокруг них
  // Создадим Множество, которое содержит живые клетки
  // Тип Set здесь более оптимален, т.к. исключает дублирование элементов
  let livingCells = new Set();

  // Получаем все "живые" клетки
  currentGen.forEach((cell, id) => {
    if (!cell) return;

    livingCells.add(id);
  });

  timerId = setInterval(() => {
    // Создадим временный массив, в который соберем все клетки вокруг "живых"
    const asideCells = [];

    // Получаем все клетки, которые находятся вокруг "живых"
    livingCells.forEach((cell, id) => {
      if (!cell) return;

      diffs.forEach((diff) => {
        let currentId = id + diff;

        if (currentId < 0) {
          currentId += cellsCount;
        } else if (currentId >= cellsCount) {
          currentId -= cellsCount;
        }

        asideCells.push(currentId);
      });
    });

    // Добавим клетки в asideCells в наше множество "живых"
    asideCells.forEach((cellId) => {
      livingCells.add(cellId);
    });

    // Создадим 2 массива. В один будем складывать ячейки,
    // которые в следующем поколении "умрут", а в другой те, которые станут
    // "живыми"
    const willDie = [];
    const willBorn = [];
    
    // Теперь пройдемся по всему множеству и поменяем состояние ячеек
    livingCells.forEach((cellId) => {
      let numberOfLivesCellsAround = 0;
      
      diffs.forEach((diff) => {
        let currentId = cellId + diff;
  
        if (currentId < 0) {
          currentId += cellsCount;
        } else if (currentId >= cellsCount) {
          currentId -= cellsCount;
        }
  
        if (currentGen[currentId]) {
          numberOfLivesCellsAround++;
        }
      });

      if (!currentGen[cellId] && numberOfLivesCellsAround === 3) {
        willBorn.push(cellId);

      } else if (currentGen[cellId] &&
          (numberOfLivesCellsAround < 2 || numberOfLivesCellsAround > 3)) {
        willDie.push(cellId);
      }
    });
    
    // Теперь обновим наше игровое поле:
    willBorn.forEach((id) => {
      context.fillStyle = '#f00';
      drawRect(id);
      currentGen[id] = true;
    });

    willDie.forEach((id) => {
      context.fillStyle = '#fff';
      drawRect(id);
      currentGen[id] = false;
    });

    // Теперь избавимся от всех "неживых" клеток
    // Соберем все "живые" в массив
    const livingCellsArr = [];

    livingCells.forEach((cellId) => {
      if (currentGen[cellId]) livingCellsArr.push(cellId);
    });

    // Создадим из livingCellsArr новое множество "живых" клеток
    livingCells = new Set(livingCellsArr);

    // Если "живых" больше нет, то игра окончена
    if (livingCells.size === 0) {
      finishGame();
    }
  }, gameSpeed);
};

stopButton.onclick = () => {
  clearInterval(timerId);
};

const finishGame = () => {
  clearInterval(timerId);

  const h1 = document.createElement('h1');
  h1.innerHTML = 'Game Over';

  document.querySelector('.container').append(h1);
};
// 添加canvas元素获取
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const mapSizeSelect = document.getElementById('mapSize');  // 添加地图大小选择器引用
const upBtn = document.querySelector('.arrow-btn.up');
const downBtn = document.querySelector('.arrow-btn.down');
const leftBtn = document.querySelector('.arrow-btn.left');
const rightBtn = document.querySelector('.arrow-btn.right');
// 添加左侧控制按钮
const upLeftBtn = document.querySelector('.arrow-btn.up-left');
const downLeftBtn = document.querySelector('.arrow-btn.down-left');
const leftLeftBtn = document.querySelector('.arrow-btn.left-left');
const rightLeftBtn = document.querySelector('.arrow-btn.right-left');
const sizeSelect = document.getElementById('sizeSelect');  // 这个变量没有被使用
const easyBtn = document.getElementById('easyBtn');
const hardBtn = document.getElementById('hardBtn');
const hellBtn = document.getElementById('hellBtn');

// 游戏常量
const GRID_SIZE = 20;
let GRID_COUNT = 20;  // 默认20×20地图
const INITIAL_SPEED_EASY = 200;  // 简单模式初始速度
const INITIAL_SPEED_HARD = 100;  // 困难模式初始速度
const INITIAL_SPEED_HELL = 50;   // 地狱模式初始速度
const SPEED_INCREASE_EASY = 3;   // 简单模式速度增加量
const SPEED_INCREASE_HARD = 5;   // 困难模式速度增加量
const SPEED_INCREASE_HELL = 8;   // 地狱模式速度增加量

// 游戏变量
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoopId = null;
let gameSpeed = INITIAL_SPEED_EASY;  // 默认简单模式
let speedIncrease = SPEED_INCREASE_EASY;
let isPaused = false;
let isGameOver = true;
let currentDifficulty = 'easy';  // 默认简单模式

// 设备检测
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

// 初始化控制按钮
function initControls() {
    // 添加事件监听的辅助函数
    function addTouchEvent(element, callback) {
        if (element) {
            // 同时添加点击和触摸事件
            element.addEventListener('click', callback);
            element.addEventListener('touchstart', function(e) {
                e.preventDefault(); // 防止触发鼠标事件
                callback(e);
            });
        }
    }

    // 现有底部控制按钮事件
    addTouchEvent(upBtn, () => {
        if (direction !== 'down') {
            nextDirection = 'up';
        }
    });

    addTouchEvent(downBtn, () => {
        if (direction !== 'up') {
            nextDirection = 'down';
        }
    });

    addTouchEvent(leftBtn, () => {
        if (direction !== 'right') {
            nextDirection = 'left';
        }
    });

    addTouchEvent(rightBtn, () => {
        if (direction !== 'left') {
            nextDirection = 'right';
        }
    });

    // 左侧控制按钮事件
    addTouchEvent(upLeftBtn, () => {
        if (direction !== 'down') {
            nextDirection = 'up';
        }
    });

    addTouchEvent(downLeftBtn, () => {
        if (direction !== 'up') {
            nextDirection = 'down';
        }
    });

    addTouchEvent(leftLeftBtn, () => {
        if (direction !== 'right') {
            nextDirection = 'left';
        }
    });

    addTouchEvent(rightLeftBtn, () => {
        if (direction !== 'left') {
            nextDirection = 'right';
        }
    });

    // 为开始、暂停、重新开始按钮添加触摸事件
    addTouchEvent(startBtn, startGame);
    addTouchEvent(pauseBtn, pauseGame);
    addTouchEvent(restartBtn, restartGame);

    // 根据设备类型调整界面
    if (isMobileDevice()) {
        // 移动设备额外处理
        canvas.style.maxWidth = '90%';
    }
}

// 初始化蛇
function initSnake() {
    const center = Math.floor(GRID_COUNT / 2);
    snake = [
        {x: center, y: center},
        {x: center - 1, y: center},
        {x: center - 2, y: center}
    ];
    direction = 'right';
    nextDirection = 'right';
}

// 生成食物
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // 绘制蛇
    snake.forEach((segment, index) => {
        // 蛇头使用深蓝色，蛇身使用亮蓝色
        ctx.fillStyle = index === 0 ? '#1a5276' : '#3498db';
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });

    // 绘制食物
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // 如果游戏结束，显示游戏结束文字和暗化背景
    if (isGameOver) {
        // 绘制半透明黑色背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制游戏结束文字
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2);

        // 修改提示文字
        ctx.font = '20px Arial';
        ctx.fillText('按R键或点击重新开始', canvas.width / 2, canvas.height / 2 + 50);
    }
}

// 移动蛇
function moveSnake() {
    direction = nextDirection;
    const head = { ...snake[0] };

    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        generateFood();
        // 增加游戏速度
        if (gameSpeed > 50) {
            gameSpeed -= speedIncrease;
        }
        // 不清空尾部，实现蛇的增长
    } else {
        // 移除尾部
        snake.pop();
    }

    // 添加新头部
    snake.unshift(head);

    // 检查碰撞
    if (checkCollision()) {
        gameOver();
        return;
    }
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];

    // 检查墙壁碰撞
    if (
        head.x < 0 ||
        head.x >= GRID_COUNT ||
        head.y < 0 ||
        head.y >= GRID_COUNT
    ) {
        return true;
    }

    // 检查自身碰撞
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

// 游戏循环
function gameLoop() {
    moveSnake();
    drawGame();
    gameLoopId = setTimeout(gameLoop, gameSpeed);
}

// 开始游戏
function startGame() {
    if (isGameOver) {
        initSnake();
        generateFood();
        isGameOver = false;
        score = 0;
        scoreElement.textContent = score;
        gameLoop();
    }

    if (isPaused) {
        isPaused = false;
        gameLoop();
        pauseBtn.innerHTML = '<i class="fa fa-pause"></i> 暂停';
    }

    startBtn.disabled = true;
    pauseBtn.disabled = false;
    restartBtn.disabled = false;
}

// 暂停游戏
function pauseGame() {
    if (isPaused) {
        isPaused = false;
        pauseBtn.innerHTML = '<i class="fa fa-pause"></i> 暂停';
        gameLoop();
    } else {
        isPaused = true;
        clearTimeout(gameLoopId);
        pauseBtn.innerHTML = '<i class="fa fa-play"></i> 继续';
    }
}

// 重新开始游戏
function restartGame() {
    clearTimeout(gameLoopId);
    isGameOver = true;
    isPaused = false;
    score = 0;
    scoreElement.textContent = score;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    restartBtn.disabled = true;
    pauseBtn.innerHTML = '<i class="fa fa-pause"></i> 暂停';
    drawGame();
}

// 游戏结束
function gameOver() {
    clearTimeout(gameLoopId);
    isGameOver = true;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    restartBtn.disabled = false;
    updateRankings(score);
}

// 键盘控制
function handleKeydown(e) {
    // 游戏结束期间，只允许相关操作
    if (isGameOver) {
        switch (e.key) {
            case 'r':
            case 'R':
                restartGame();
                break;
            case 'Enter':
                startGame();
                break;
        }
        return;
    }

    // 游戏进行中处理所有按键
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') {
                nextDirection = 'up';
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') {
                nextDirection = 'down';
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') {
                nextDirection = 'left';
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') {
                nextDirection = 'right';
            }
            break;
        case ' ':
            pauseGame();
            break;
        case 'Enter':
            startGame();
            break;
    }
}

// 设置画布大小
function setCanvasSize(mapSize = GRID_COUNT) {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth;
    
    const size = Math.min(containerWidth - 40, mapSize * GRID_SIZE);
    canvas.width = size;
    canvas.height = size;
    GRID_COUNT = Math.floor(canvas.width / GRID_SIZE);
}

// 初始化游戏
function initGame() {
    highScoreElement.textContent = highScore;
    initControls();
    setCanvasSize();
    restartGame();

    // 确保移除旧的事件监听器，避免重复绑定
    if (startBtn) {
        startBtn.removeEventListener('click', startGame);
        startBtn.addEventListener('click', startGame);
    }
    if (pauseBtn) {
        pauseBtn.removeEventListener('click', pauseGame);
        pauseBtn.addEventListener('click', pauseGame);
        console.log('暂停按钮事件监听器已添加'); // 用于调试
    }
    if (restartBtn) {
        restartBtn.removeEventListener('click', restartGame);
        restartBtn.addEventListener('click', restartGame);
    }

    // 添加地图大小选择事件监听器
    if (mapSizeSelect) {
        mapSizeSelect.addEventListener('change', () => {
            const newSize = parseInt(mapSizeSelect.value);
            setCanvasSize(newSize);
            restartGame();
        });
    }

    // 添加难度按钮事件监听器
    if (easyBtn) {
        easyBtn.addEventListener('click', () => {
            currentDifficulty = 'easy';
            gameSpeed = INITIAL_SPEED_EASY;
            speedIncrease = SPEED_INCREASE_EASY;
            easyBtn.classList.add('active');
            hardBtn.classList.remove('active');
            hellBtn.classList.remove('active');
        });
    }
    if (hardBtn) {
        hardBtn.addEventListener('click', () => {
            currentDifficulty = 'hard';
            gameSpeed = INITIAL_SPEED_HARD;
            speedIncrease = SPEED_INCREASE_HARD;
            easyBtn.classList.remove('active');
            hardBtn.classList.add('active');
            hellBtn.classList.remove('active');
        });
    }
    if (hellBtn) {
        hellBtn.addEventListener('click', () => {
            currentDifficulty = 'hell';
            gameSpeed = INITIAL_SPEED_HELL;
            speedIncrease = SPEED_INCREASE_HELL;
            easyBtn.classList.remove('active');
            hardBtn.classList.remove('active');
            hellBtn.classList.add('active');
        });
    }
}

// 排名相关功能
let rankings = JSON.parse(localStorage.getItem('snakeRankings')) || [];
const MAX_RANKINGS = 5;

function updateRankings(newScore) {
    rankings.push(newScore);
    rankings.sort((a, b) => b - a);
    rankings = rankings.slice(0, MAX_RANKINGS);
    localStorage.setItem('snakeRankings', JSON.stringify(rankings));
    displayRankings();
}

function displayRankings() {
    const rankingElement = document.getElementById('rankings');
    if (!rankingElement) return;

    rankingElement.innerHTML = '';
    rankings.forEach((score, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'rank-item';
        
        if (index === 0) {
            rankItem.classList.add('first-place');
        } else if (index === 1) {
            rankItem.classList.add('second-place');
        } else if (index === 2) {
            rankItem.classList.add('third-place');
        }
        
        rankItem.innerHTML = `<span class='rank'>${index + 1}.</span> <span class='score'>${score}</span>`;
        rankingElement.appendChild(rankItem);
    });
}

// 页面加载完成事件
window.addEventListener('load', () => {
    // 确保DOM完全加载后再初始化
    setTimeout(() => {
        initGame();
        displayRankings();
    
        if (mapSizeSelect) {
            const event = new Event('change');
            mapSizeSelect.dispatchEvent(event);
        }
    }, 100); // 延迟100毫秒
});

// 窗口大小变化事件
window.addEventListener('resize', setCanvasSize);

// 键盘事件监听
window.addEventListener('keydown', handleKeydown);

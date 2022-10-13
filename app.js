const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`dB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryAndStatus = (requestQuery)=>{
    return requestQuery.category!==undefined && requestQuery.status!==undefined;
}
const hasCategoryAndPriority = (requestQuery)=>{
    return requestQuery.category!==undefined && requestQuery.priority!==undefined;
}
const hasCategory = (requestQuery)=>{
    return requestQuery.category!==undefined;
}

const gettingValidDate=(request,response,next)=>{
    if(request.query = format(new Date(date), 'MM-dd-yyyy')){
        request.query = request.query;
        response.status(400);
        response.send("Invalid Due Date");
    }else{
        next();
    }
    
});

const validatePriority =(request,response,next)=>{
    if (requestQuery.priority===HIGH || MEDIUM || LOW){
        request.query=requestQuery.priority;
        response.status(400);
        response.send("Invalid Todo Priority");
    }else {
        next();
    };
};

const validateStatus = (request,response,next)=>{
    if(requestQuery.status === TO DO||IN PROGRESS ||DONE){
        request.query= requestQuery.status;
        response.status(400);
        response.send("Invalid Todo Status");
    }else {
        next();
    }
};

const validateCategory =(requestQuery)=>{
    if(requestQuery.category===WORK ||HOME||LEARNING){
        request.query= requestQuery.category;
        response.status(400);
        response.send("Invalid Todo Category");
    }else {
        next();
    }
};

app.get("/todos/",gettingValidDate,validateCategory,validatePriority,validateStatus, async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status,dueDate,category } = request.query;

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE 
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}'
        ;`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE %${search_q}% AND 
      priority ='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
      AND status ='${status}';`;
      break;
    case hasCategory(request.query):
        getTodosQuery=`SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}';`;
    case hasCategoryAndPriority(request.query):
        getTodosQuery=`SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND 
         priority='${priority}';`;   
     case hasCategoryAndStatus(request.query):
        getTodosQuery=`SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND 
         priority='${status}';`;           
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `INSERT INTO todo(id,todo,priority,status) VALUES 
    (${id},'${todo}','${priority}','${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `UPDATE todo SET todo='${todo}',
    priority = '${priority}',status ='${status}' WHERE id =${todoId};
    `;
  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id =${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

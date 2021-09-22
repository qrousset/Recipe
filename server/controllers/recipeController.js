const { Recipe } = require("../models/Models.js");
//none of this is really used in the production version...
const axios = require("axios");
const recipeController = {};
const fs = require("fs");
const path = require("path");

recipeController.getRecipe = (req, res, next) => {
  Recipe.find({
    cuisine: req.body.cuisine,
    ingredients: { $all: req.body.ingredients },
  })
    .then((recipes) => {
      res.locals.recipes = recipes;
      next();
    })
    .catch((err) => next(err));
};

//used for getting all recipes from API into our database for ease access
recipeController.getAllRecipesToDB = (req, res, next) => {
  //iterate through all API request by alpahabets and store it inside an array
  const alphabetString = "abcdefghijklmnopqrstuvwxyz";
  const array = [];
  for (let i = 0; i < alphabetString.length; i++) {
    array.push(
      axios.get(
        `https://www.themealdb.com/api/json/v1/1/search.php?f=${alphabetString[i]}`
      )
    );
  }

  //resolve all promises in an array
  Promise.all(array)
    .then((results) => {
      // console.log(results[0].data)
      const mealArr = [];
      //iterate through each responses, and filter data the format that we want, and store it inside the meal Arr;
      for (let i = 0; i < results.length; i++) {
        const { meals } = results[i].data;
        // meals = array [ {recipe1} , {recipe2} , {recipe3}]
        // `strIngredient${i}` : `strMeasure${i}`  20 items total
        if (meals != null) {
          meals.forEach((meal) => {
            const temp1 = [];
            const temp2 = [];
            for (let j = 1; j <= 20; j++) {
              const ingredient = meal[`strIngredient${j}`];
              const measure = meal[`strMeasure${j}`];
              if (ingredient) {
                temp1.push(ingredient);
                temp2.push(measure);
              }
            }
            const { idMeal, strMeal, strArea, strInstructions, strMealThumb } =
              meal;
            const body = {
              id: idMeal,
              name: strMeal,
              cuisine: strArea,
              instruction: strInstructions,
              imgURL: strMealThumb,
              ingredients: temp1,
              measures: temp2,
            };
            // fs.appendFileSync(path.join(__dirname, 'test.json'), `${JSON.stringify(body)};`)
            mealArr.push(body);
          });
        }
      }
      //save it inside the locals and move to the next .then chain
      res.locals.mealArr = mealArr;
    })
    .then(() => {
      //using the mealArr as a query to create/add multiple items into our recipe collection;
      Recipe.create(res.locals.mealArr)
        .then((result) => next())
        .catch((err) => console.log(err));
    })
    .catch((err) => next(err));
};

module.exports = recipeController;

//we will have to call for a-z API calls
//once we recieve the result, we would have to loop through an array (it should be object with a key meal and value of array)
//we would do deconstruction,
//and db.create to add each meal's recipe in the database
// for (let i = 0; i < alphabetString.length; i++) {
//   array.push(axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?f=${alphabetString[i]}`));
// }
// { meals: [ [Object], [Object], [Object], [Object] ]
// const post = async () => {

//   const mealArr = [];
//   for(let i = 0; i < array.length; i++) {
//     const { meals } = array[i];
//     // meals = array [ {recipe} , recipe , recipe]
//     // `strIngredient${i}` : `strMeasure${i}`  1 - 20

//     meals.forEach( async (meal) =>{
//       const temp = [];

//       for(let j = 1; j <= 20; j++){
//         const ingredient = meal[`strIngredient${j}`];
//         const measure = meal[`strMeasure${j}`];
//         if(ingredient) {
//           temp.push({ [`${ingredient}`] : measure});
//         }
//       }

//       const { idMeal, strMeal, strArea, strInstructions, strMealThumb } = meal;

//       const addItem = await Recipe.create({
//         id: idMeal,
//         name: strMeal,
//         cuisine: strArea,
//         instruction: strInstructions,
//         imgURL: strMealThumb,
//         ingredients: temp,
//       })
//     })
//   }
//   next();
// }
// post();

// previous stuff
// recipeController.findMeals = (req, res, next) => {
// fetch api data and have a way to filter out data
// take in pantry ingredients in request body and prioritize results based on pantry ingredients
// filter based on cuisines and input ingredients from filter pop-up
// }

/* Spoonacular Docs: https://spoonacular.com/food-api/docs */
// example of fetch request from frontend to API:
// componentDidMount() {
//     //additional params and api key needed at end of fetch req
//     fetch("https://api.spoonacular.com/recipes/findByIngredients?ingredients=<ingredientStringInput>") //ingredientStringInput
//       .then(res => res.json())
//       .then(
//         (result) => {
//           this.setState({
//             isLoaded: true,
//             items: result.items
//           });
//         },
//         // Note: it's important to handle errors here
//         // instead of a catch() block so that we don't swallow
//         // exceptions from actual bugs in components.
//         (error) => {
//           this.setState({
//             isLoaded: true,
//             error
//           });
//         }
//       )
//   }

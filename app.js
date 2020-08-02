// UI Selectors
const UISelectors = {
  _mealList: '#meal-list',
  _addBtn: '.add-btn',
  _updateBtn: '.update-btn',
  _deleteBtn: '.delete-btn',
  _backBtn: '.back-btn',
  _clearAllBtn: '.clearAll-btn',
  _mealInput: '#meal-name',
  _caloriesInput: '#meal-calories',
  _totalCalories: '.total-calories'
};

// Meal ID Generator
function* IDGenerator() {
  let index = 0;

  while (true) {
    yield index++;
  }
}

let getID = IDGenerator();

// Storage Controller
const StorageCtrl = (function () {
  const meals = localStorage.getItem('meals');

  return {
    getMeals() {
      return JSON.parse(meals) || [];
    },
    storeMeals(meals) {
      localStorage.setItem('meals', JSON.stringify(meals));
    },
    clearMeals() {
      localStorage.removeItem('meals');
    }
  };
})();

// Meal Controller
const MealCtrl = (function () {
  // Constructor to initialize meal
  const Init = function (id, meal, calories) {
    this.id = id;
    this.meal = meal;
    this.calories = calories;
  };

  // State
  const meals = StorageCtrl.getMeals();

  let activeMeal = null;

  function calculateCalories() {
    return meals.reduce((acc, meal) => acc + meal.calories, 0);
  }

  return {
    getMeals() {
      return { meals, totalCalories: calculateCalories() };
    },
    addMeal(name, calories) {
      meals.push({ id: getID.next().value, name, calories });
      StorageCtrl.storeMeals(meals);
      return { meals, totalCalories: calculateCalories() };
    },
    editMeal(id) {
      indx = meals.findIndex(meal => meal.id === id);
      return (activeMeal = meals[indx]);
    },
    updateMeal(name, calories) {
      const indx = meals.findIndex(meal => meal.id === activeMeal.id);
      meals[indx] = { id: activeMeal.id, name, calories };
      activeMeal = null;
      StorageCtrl.storeMeals(meals);
      return { meals, totalCalories: calculateCalories() };
    },
    deleteMeal() {
      const indx = meals.findIndex(meal => meal.id === activeMeal.id);
      meals.splice(indx, 1);
      StorageCtrl.storeMeals(meals);
      return { meals, totalCalories: calculateCalories() };
    },
    deleteAll() {
      meals.length = 0;
      activeMeal = null;
      StorageCtrl.clearMeals();
    },
    resetActiveMeal() {
      activeMeal = null;
    }
  };
})();

// UI Controller
const UICtrl = (function () {
  // add new meal to list
  // load init meals from state
  // on edit click => change current meal in form & show buttons
  // clear list & clear form

  const mealInput = document.querySelector(UISelectors._mealInput),
    caloriesInput = document.querySelector(UISelectors._caloriesInput),
    addBtn = document.querySelector(UISelectors._addBtn),
    updateBtn = document.querySelector(UISelectors._updateBtn),
    deleteBtn = document.querySelector(UISelectors._deleteBtn);

  function toggleButtons(edit) {
    if (edit) {
      addBtn.parentElement.classList.add('hidden');
      updateBtn.parentElement.classList.remove('hidden');
      deleteBtn.parentElement.classList.remove('hidden');
    } else {
      addBtn.parentElement.classList.remove('hidden');
      updateBtn.parentElement.classList.add('hidden');
      deleteBtn.parentElement.classList.add('hidden');
    }
  }

  return {
    getActiveMeal() {
      return { meal: mealInput.value, calories: +caloriesInput.value };
    },
    populateItems: function (mealsList, totalCalories) {
      document.querySelector(UISelectors._mealList).style.display = 'block';
      let html = '';
      mealsList.forEach(meal => {
        const { id, name, calories } = meal;
        html += `
					<li class="collection-item" id="item-${id}">
						<strong class="title meal-name">${name}</strong>
						<em class="meal-calories blue-text text-darken-1"> ${calories} calories</em>
						<i class="fa fa-pencil secondary-content meal-editBtn"></i>
					</li>
				`;
      });

      // Append to UI
      document.querySelector(UISelectors._mealList).innerHTML = html;

      document.querySelector(UISelectors._totalCalories).textContent = totalCalories;
    },
    editMeal(meal) {
      mealInput.value = meal.name;
      caloriesInput.value = meal.calories;
      mealInput.nextElementSibling.classList.add('active');
      caloriesInput.nextElementSibling.classList.add('active');
      toggleButtons(true);
    },
    updateMeal() {},
    resetMealForm() {
      mealInput.value = '';
      caloriesInput.value = '';
      mealInput.nextElementSibling.classList.remove('active');
      caloriesInput.nextElementSibling.classList.remove('active');
      toggleButtons();
    }
  };
})();

// App controller
const App = (function (MealCtrl, UICtrl) {
  return {
    init() {
      const { meals, totalCalories } = MealCtrl.getMeals();
      if (meals.length) {
        UICtrl.populateItems(meals, totalCalories);
      } else {
        document.querySelector(UISelectors._mealList).style.display = 'none';
      }
    },
    addMeal(e) {
      e.preventDefault();
      // Store in meals & call populate
      const { meal, calories } = UICtrl.getActiveMeal();

      if (meal && (calories || calories === 0)) {
        const { meals, totalCalories } = MealCtrl.addMeal(meal, calories);

        UICtrl.populateItems(meals, totalCalories);

        // Reset Form
        UICtrl.resetMealForm();
      }
    },
    editMeal(e) {
      e.preventDefault();
      if (e.target.classList.contains('fa-pencil')) {
        const listId = e.target.parentElement.id || '';
        if (listId) {
          const mealId = listId.slice(listId.length - 1);
          const currentMeal = MealCtrl.editMeal(+mealId);

          UICtrl.editMeal(currentMeal);
        }
      }
    },
    updateMeal(e) {
      e.preventDefault();
      const { meal, calories } = UICtrl.getActiveMeal();
      UICtrl.resetMealForm();
      const { meals, totalCalories } = MealCtrl.updateMeal(meal, calories);
      UICtrl.populateItems(meals, totalCalories);
    },
    deleteMeal(e) {
      e.preventDefault();
      const { meals, totalCalories } = MealCtrl.deleteMeal();
      UICtrl.populateItems(meals, totalCalories);
      UICtrl.resetMealForm();
    },
    resetMealForm(e) {
      e.preventDefault();
      MealCtrl.resetActiveMeal();
      UICtrl.resetMealForm();
    },
    clearAllMeals(e) {
      e.preventDefault();
      MealCtrl.deleteAll();
      UICtrl.populateItems([], 0);
      document.querySelector(UISelectors._mealList).style.display = 'none';
      getID = IDGenerator();
    }
  };
})(MealCtrl, UICtrl);

// EventListeners
document.addEventListener('DOMContentLoaded', function () {
  // Button Click Listeners
  document.querySelector(UISelectors._addBtn).addEventListener('click', App.addMeal);
  document.querySelector(UISelectors._updateBtn).addEventListener('click', App.updateMeal);
  document.querySelector(UISelectors._deleteBtn).addEventListener('click', App.deleteMeal);
  document.querySelector(UISelectors._backBtn).addEventListener('click', App.resetMealForm);
  document.querySelector(UISelectors._clearAllBtn).addEventListener('click', App.clearAllMeals);

  // UL List Item Edit
  document.querySelector(UISelectors._mealList).addEventListener('click', App.editMeal);

  App.init();
});

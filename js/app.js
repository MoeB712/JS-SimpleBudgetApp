/* 
    BUDGET CONTROLLER 
    -----------------------------------
    Calculate the budget.
*/
var budgetController = (function() {

    /* Income and Expense function constructors for the objects */
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    /* Function prototypes for the expense data structure */
    Expense.prototype.calcPercentage = function(totalIncome) {
        
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    /* Data structure of Income and Expense objects */
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    /* Function: Calculate totals */
    var calculateTotal = function(type) {
        var sum = 0;

        data.allItems[type].forEach(function(current) {
            sum = sum + current.value;
        });

        data.totals[type] = sum;
    };

    return {
        /* Add item to the structure */
        addItem: function(type, desc, val) {
            var newItem, ID;
            
            /* Create a new ID */
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
            /* Create a new Inc or Exp object */
            if (type === 'exp') {
                newItem = new Expense(ID, desc, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, desc, val);
            }

            /* Add new item to the data structure */
            data.allItems[type].push(newItem);

            /* Return the new item */
            return newItem;

        },

        /* Delete an item from the data structure */
        deleteItem: function(type, id) {
            var ids, index;

            /* Get the list of all IDs into an array */
            ids = data.allItems[type].map(function(current){
                return current.id;
            });

            /* get the index of the id */
            index = ids.indexOf(id);

            /* delete the element in the data structure with that index */
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        /* Calculate the budget */
        calculateBudget: function() {
            /* Calculate total income and expenses */
            calculateTotal('exp');
            calculateTotal('inc');

            /* Calculate the budget: income - expenses */
            data.budget = data.totals.inc - data.totals.exp;

            /* Only calculate % if income is more than $0) */
            if (data.totals.inc > 0) {
                /* Calculate the percentage of income that we spent */
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        /* Calculate the percentages for each transaction */
        calculatePercentages: function() {
            data.allItems.exp.forEach(function(currentExp) {
                currentExp.calcPercentage(data.totals.inc);
            });
            console.log(data);
        },

        getPercentages: function() {
            var allPercentages = data.allItems.exp.map(function(cur){
                return cur.getPercentage();
            });
            return allPercentages;
        },

        /* return the total budget (inc, exp) */
        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },

        /* Strictly used for testing to validate our structured data */
        testing: function() {
            return data;
        }
    };

})();
 
/* 
    UI CONTROLLER
    -----------------------------------
    Get and update the contents of the UI.
*/
var UIController = (function() {

    /* DOM Strings defined in HTML */
    var DOMstrings = {
        inputBtn: '.add__btn',
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage', 
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function(num, type) {
        var numSplit, int, dec;

        /*
            Rules:
            1. + or - before number.
            2. exactly 2 decimal points.
            3. Comma separating the thousands.
        */

        num = Math.abs(num);
        num = num.toFixed(2);
        
        numSplit = num.split('.');
        int = numSplit[0];
        dec = numSplit[1];

        if(int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        }

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    };

    /*
        The variable 'fields' is a node list since it has a list of each html element containing the expensesPercLabel (called nodes). We need to loop through each element in the node list (fields) however node list variables don't have a 'ForEach' property.
        Here we create our own 'ForEach' function that will have a for loop and run a callback function for each element.

        Now we can use this function and pass a callback function that will get executed for each element.
    */
    var nodeListForEach = function(list, callback) {
        for(var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    /* Return an object with the following properties */
    return {
        /* Return values of income/expense the user entered */
        getInput: function(){
            return {
                type: document.querySelector(DOMstrings.inputType).value, // 'inc' for income, or 'exp' for expense
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },

        /* Add item to the HTML list */
        addListItem: function(obj, type) {
            var html, element;

            /* Create HTML string with placeholder text */
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;

                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp'){
                element = DOMstrings.expensesContainer;

                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            /* Replace the placeholder text with some actual data */
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            /* Insert the HTML into the DOM */
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        /* Delete the item from the DOM after it's deleted from the data structure */
        deleteListItem: function(selectorID) {

            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);

        },

        /* Clear the description and value fields in the HTML page */
        clearFields: function() {
            var fields, fieldsArr;

            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function(current, index, array) {
                current.value = '';
            });

            fieldsArr[0].focus();
        },

        /* Display the budget on the HTML page */
        displayBudget: function(obj) {
            var type;

            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentag + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },

        /* Display the percentage for each expense */
        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

            nodeListForEach(fields, function(current, index) {
                if(percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });

        },

        /* Display the Month */
        displayMonth: function() {
            var now, year, month, months;

            /* Get today's dates */
            now = new Date();
            year = now.getFullYear();
            month = now.getMonth();

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ', ' + year;
        },

        /* Change the color ouline of input fields when use changes betwee +/- */
        changedType: function() {
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue
            );
            
            /* Loop through each element in node list and add the .red-focus class */
            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },

        /* Return a copy of the DOM strings mentioned in HTML*/
        getDOMstrings: function() {
            return DOMstrings;
        }
    };

})();

/* 
    GLOBAL APP CONTROLLER
    -----------------------------------
    Manage the events and call events from other controllers.
*/
var controller = (function(budgetCtrl, UICtrl) {

    var setupEventListeners = function() {

        /* Get copy of DOM strings mentioned in HTML */
        var DOM = UICtrl.getDOMstrings();

        /* Add Button Pressed */
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        /* Enter was pressed */
        document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        /* Event Handler for deleting an item on a list */
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        /* Change the color ouline of input fields when use changes betwee +/- */
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };

    /* Update the percentages for each transaction */
    var updatePercentages = function() {

        /* 1. Calculate the percentages */
        budgetCtrl.calculatePercentages();

        /* 2. Read percentages from the budget controller */
        var percentages = budgetCtrl.getPercentages();

        /* 3. Update the UI with the new percentages */
        UICtrl.displayPercentages(percentages);
    };

    /* Update the budget function */
    var updateBudget = function() {
        /* 1. Calculate the budget */
        budgetCtrl.calculateBudget();

        /* 2. Return the budget */
        var budget = budgetCtrl.getBudget();

        /* 3. Display the budget on the UI */
        UICtrl.displayBudget(budget);
    };

    /* Function: Login to add item to the list */ 
    var ctrlAddItem = function() {
        var input, newItem;

        /* 1. Get field input data */
        input = UICtrl.getInput();

        if (input.description !== '' && !isNaN(input.value) && input.value > 0){
            /* 2. Add the item to the budget controller */
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            /* 3. Add the item to the UI */
            UICtrl.addListItem(newItem, input.type);

            /* 4. Clear fields */
            UICtrl.clearFields();

            /* 5. Calculate and update the budget */
            updateBudget();

            /* 6. Calculate and update the percentages */
            updatePercentages();
        }
    };

    /* Function to delete an item from a list */
    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, id;

        /* Get the ID on the item user clicks on the webpage */
        itemID = event.target.parentNode.parentNode.parentNode.id;
        
        /* There won't be any IDs unless the user click the x button. Verify there's an ID and extract the type and ID # from the string */
        if (itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            id = parseInt(splitID[1]);
        }

        /* 1. Delete the item from the data structure */
        budgetCtrl.deleteItem(type, id);

        /* 2. Delete the item from the UI */
        UICtrl.deleteListItem(itemID);

        /* 3. Update and show the new budget */
        updateBudget();

        /* 4. Calculate and update the percentages */
        updatePercentages();
    };

    return {
        init: function() {
            console.log('Application has started');
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };

})(budgetController, UIController);

/* Start the application */
controller.init();
class InsufficientFundsError extends Error { 
    constructor(message) {
        super(message);
        this.name = "InsufficientFundsError";
    }
}

class InvalidTransactionError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidTransactionError";
    }
}

class AuthorizationError extends Error {
    constructor(message) {
        super(message);
       this.name = "AuthorizationError";
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

class BankAccount {
  #balance;
  #transactions;

  constructor(accountNumber, initialBalance = 0) {
    if (new.target === BankAccount) {
      throw new Error("Abstract class error new ");
    }

    this.validateAccountNumber(accountNumber);
    this.accountNumber = accountNumber;

    if (typeof initialBalance !== "number" || initialBalance < 0) {
      throw new ValidationError("Initial balance not number");
    }

    this.#balance = initialBalance;
    this.#transactions = [];
  }

  get balance() {
    return this.#balance;
  }

  set balance(amount) {
    this.#balance = amount;
  }


  get transactions() {
    return [...this.#transactions];
  }


  #addTransaction(tx) {
    this.#transactions.push(tx);
  }

  deposit(amount) {
    if (amount <= 0) {
      throw new ValidationError("Deposit amout < zero ");
    }
    this.#balance += amount;


    this.#addTransaction(
      new Transaction({
        accountNumber: this.accountNumber,
        amount,
        transactionType: "DEPOSIT",
        fromAccount: null,
        toAccount: this.accountNumber
      })
    );
  }

  withdraw(amount) {
    if (amount <= 0) {
      throw new ValidationError("Withdrawal amount dont empty");
    }
    if (this.#balance < amount) {
      throw new InsufficientFundsError("Insufficient Error");
    }
    this.#balance -= amount;

 
    this.#addTransaction(
      new Transaction({
        accountNumber: this.accountNumber,
        amount,
        transactionType: "WITHDRAW",
        fromAccount: this.accountNumber,
        toAccount: null
      })
    );
  }

  getBalance() {
    return this.#balance;
  }

  transferFunds(targetAccount, amount) {
    if (!(targetAccount instanceof BankAccount)) {
      throw new InvalidTransactionError("Target account  instanceof BankAccount Error");
    }
    if (amount <= 0) {
      throw new ValidationError("amaut velidation error");
    }

    this.withdraw(amount);
    targetAccount.deposit(amount);

    const tx = new Transaction({
      accountNumber: this.accountNumber,
      amount,
      transactionType: "TRANSFER",
      fromAccount: this.accountNumber,
      toAccount: targetAccount.accountNumber
    });

    this.#addTransaction(tx);
    targetAccount.#addTransaction(
      new Transaction({
        accountNumber: targetAccount.accountNumber,
        amount,
        transactionType: "TRANSFER_IN",
        fromAccount: this.accountNumber,
        toAccount: targetAccount.accountNumber
      })
    );
  }

  validateAccountNumber(accountNumber) {
    if (typeof accountNumber !== "string" || accountNumber.length < 10) {
      throw new ValidationError("Account number length  10 and more");
    }
  }

  validateAccountType(individual, joint) {
    if (typeof individual !== "string" || typeof joint !== "string") {
      throw new ValidationError("Accountvalidation error");
    }
  }
}


class IndividualAccount extends BankAccount {
    constructor(accountNumber, balance) {
        super(accountNumber, balance);
    }

}

class JointAccount extends BankAccount {
    constructor (accountNumber, balance = 0, owners = []) {
         super(accountNumber, "joint", balance);
          if (!Array.isArray(owners) || owners.length === 0) {
            throw new ValidationError("JointAccount Error");
        }
    }
    deposit(amount) {

        if(amaout <= 0) {
            throw new ValidationError("Deposit amout empty");
        }
    }
    withdraw(amaout) {

       if(amaout <= 0)  {
         throw new ValidationError("Withdrew amout Errror")
       }

       if(this.getBalance() < amaout) {
        throw new InsufficientFundsError("InsufficientError");
       }
    }
}



class Customer {
  constructor(name, email, phone) {
    this.name = name;
    this.email = email;
    this.phone = phone; 
    this.accounts = [];
  }

  addAccount(account) {
    if (!(account instanceof BankAccount)) {
      throw new ValidationError("Account must be an instance of BankAccount.");
    }
    this.accounts.push(account);
    return account;
  }

  viewAccounts() {
    return this.accounts;
  }

  viewTransactionHistory(accountNumber) {
    const account = this.accounts.find(acc => acc.accountNumber === accountNumber);
    if (!account) throw new ValidationError("Account not found.");
    return account.transactions || [];
  }
}



function defineValidated(obj, proprt, initial, validateFn) {
  let value = initial;
  Object.defineProperty(obj, proprt, {
    enumerable: true,
    configurable: false,
    get() { 
        return value; 
    },
    set(val) {
      if (!validateFn(val)) throw new ValidationError(`${proprt} validation Error`);
      value = val;
    }
  });
}


class Transaction {
  constructor({ accountNumber, amount, transactionType, fromAccount=null, toAccount=null }) {
    if (!(typeof amount === "number" && amount > 0)) {
        throw new ValidationError("amount must be positive");
    }
    this.accountNumber = accountNumber;
    this.amount = amount;
    this.transactionType = transactionType;
    this.fromAccount = fromAccount;
    this.toAccount = toAccount;
    this.timestamp = new Date().toISOString();
  }
}
const cout = new Customer("Edmon", "edmonpetrosyan07@mail.com", +37493607262);



const user1 = new IndividualAccount("145xs6s51s51x5ssx1", 1000);
const user2 = new IndividualAccount("AramAccount1234", 300);

cout.addAccount(user1);
cout.addAccount(user2);


user1.transferFunds(user2, 100);

console.log(user1);
console.log(user1.getBalance());
console.log(user2);
console.log(user2.getBalance());

console.log("User1-->", cout.viewTransactionHistory(user1.accountNumber));
console.log("User2-->:", cout.viewTransactionHistory(user2.accountNumber));







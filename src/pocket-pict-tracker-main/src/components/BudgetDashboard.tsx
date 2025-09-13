import React, { useState } from "react";
import { PlusCircle, FileUp, BarChart3, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const BudgetDashboard = () => {
  const [budget, setBudget] = useState(3000);
  const [spent, setSpent] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: "", amount: "" });

  const remaining = budget - spent;
  const avgDaily = spent > 0 ? (spent / 30).toFixed(2) : 0;
  const daysLeft = 16; // calculate dynamically if you track period

  const sendStateToBackend = async (updatedState: {
    transactions: any[];
    spent: number;
  }) => {
    try {
      const response = await fetch("/api/update-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: updatedState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send data to backend");
      }

      const data = await response.json();
      console.log("Backend response:", data);
    } catch (error) {
      console.error(error);
    }
  };

  const addTransaction = () => {
    if (!newExpense.name || !newExpense.amount) return;
    const amt = parseFloat(newExpense.amount);
    const tx = { ...newExpense, amount: amt, date: new Date().toISOString() };
    const updatedTransactions = [tx, ...transactions];
    const updatedSpent = spent + amt;

    setTransactions(updatedTransactions);
    setSpent(updatedSpent);
    setNewExpense({ name: "", amount: "" });
    setModalOpen(false);

    // Send to backend
    sendStateToBackend({
      transactions: updatedTransactions,
      spent: updatedSpent,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded">
              <span className="text-white font-bold">B</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">Budget Tracker</h1>
              <p className="text-sm text-gray-500">
                Stay on top of your finances
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Good morning,</p>
            <p className="font-semibold">Alex Johnson</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Monthly Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Monthly Budget</span>
              <span className="text-green-600 text-xl font-bold">
                ${remaining.toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Spent: ${spent}</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Avg. Daily</p>
                <p className="text-lg font-semibold">${avgDaily}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Days Left</p>
                <p className="text-lg font-semibold">{daysLeft}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4">
          <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
            <FileUp className="h-4 w-4" /> Upload Receipt
          </Button>
          <Button
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" /> Add Expense
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Settings
          </Button>
        </div>

        {/* Spending Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-500">
                No spending data yet. Add some transactions to see your spending
                breakdown.
              </p>
            ) : (
              <div>{/* TODO: chart goes here */}</div>
            )}
          </CardContent>
        </Card>

        {/* Spending Categories */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Food & Dining", limit: 600 },
            { name: "Transportation", limit: 300 },
            { name: "Entertainment", limit: 200 },
            { name: "Shopping", limit: 400 },
            { name: "Housing", limit: 1200 },
            { name: "Healthcare", limit: 150 },
          ].map((cat) => (
            <Card key={cat.name}>
              <CardContent className="p-4">
                <p className="font-medium">{cat.name}</p>
                <p className="text-sm text-gray-500">$0 of ${cat.limit}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Recent Transactions</span>
              <span className="text-sm text-gray-500">Last 7 days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-500">
                No transactions yet. Add your first transaction to get started!
              </p>
            ) : (
              <ul className="space-y-2">
                {transactions.map((tx, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{tx.name}</span>
                    <span className="font-medium">${tx.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Expense Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
          <Input
            placeholder="Expense name"
            value={newExpense.name}
            onChange={(e) =>
              setNewExpense({ ...newExpense, name: e.target.value })
            }
            className="mb-2"
          />
          <Input
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense({ ...newExpense, amount: e.target.value })
            }
            className="mb-4"
          />
          <Button
            onClick={addTransaction}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Save
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default BudgetDashboard;

// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Progress } from "@/components/ui/progress";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Camera,
//   Plus,
//   DollarSign,
//   TrendingUp,
//   Receipt,
//   PieChart,
//   History,
//   Target,
//   ArrowRight,
//   Edit,
// } from "lucide-react";

// interface Transaction {
//   id: string;
//   amount: number;
//   category: string;
//   description: string;
//   date: string;
//   type: "expense" | "income";
//   receipt?: string;
// }

// interface Budget {
//   category: string;
//   limit: number;
//   spent: number;
// }

// interface AppState {
//   transactions: Transaction[];
//   budgets: Budget[];
//   totalBudget: number;
//   totalSpent: number;
//   categories: string[];
// }

// const BudgetDashboard = () => {
//   const { toast } = useToast();
//   const [state, setState] = useState<AppState>({
//     transactions: [],
//     budgets: [
//       { category: "Food", limit: 500, spent: 0 },
//       { category: "Transportation", limit: 200, spent: 0 },
//       { category: "Entertainment", limit: 150, spent: 0 },
//       { category: "Utilities", limit: 300, spent: 0 },
//       { category: "Shopping", limit: 250, spent: 0 },
//       { category: "Healthcare", limit: 100, spent: 0 },
//     ],
//     totalBudget: 1500,
//     totalSpent: 0,
//     categories: [
//       "Food",
//       "Transportation",
//       "Entertainment",
//       "Utilities",
//       "Shopping",
//       "Healthcare",
//     ],
//   });

//   const [receiptFile, setReceiptFile] = useState<File | null>(null);
//   const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
//   const [newTransaction, setNewTransaction] = useState({
//     amount: "",
//     category: "",
//     description: "",
//   });
//   const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
//   const [isManualModalOpen, setIsManualModalOpen] = useState(false);

//   const sendStateToServer = async (updatedState: Partial<AppState>) => {
//     try {
//       const response = await fetch("/api/update-budget", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           state: { ...state, ...updatedState },
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setState(data);
//         toast({
//           title: "Success",
//           description: "Budget data updated successfully!",
//         });
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update budget data",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setReceiptFile(file);
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setReceiptPreview(e.target?.result as string);
//       };
//       reader.readAsDataURL(file);

//       toast({
//         title: "Receipt uploaded",
//         description: "Ready to process your receipt!",
//       });
//     }
//   };

//   const addTransaction = () => {
//     if (
//       !newTransaction.amount ||
//       !newTransaction.category ||
//       !newTransaction.description
//     ) {
//       toast({
//         title: "Missing information",
//         description: "Please fill in all fields",
//         variant: "destructive",
//       });
//       return;
//     }

//     const transaction: Transaction = {
//       id: Date.now().toString(),
//       amount: parseFloat(newTransaction.amount),
//       category: newTransaction.category,
//       description: newTransaction.description,
//       date: new Date().toISOString().split("T")[0],
//       type: "expense",
//       receipt: receiptPreview || undefined,
//     };

//     const updatedTransactions = [...state.transactions, transaction];
//     const updatedSpent = state.totalSpent + transaction.amount;

//     // Update budget spent amounts
//     const updatedBudgets = state.budgets.map((budget) =>
//       budget.category === transaction.category
//         ? { ...budget, spent: budget.spent + transaction.amount }
//         : budget
//     );

//     sendStateToServer({
//       transactions: updatedTransactions,
//       totalSpent: updatedSpent,
//       budgets: updatedBudgets,
//     });

//     // Reset form and close modals
//     setNewTransaction({ amount: "", category: "", description: "" });
//     setReceiptFile(null);
//     setReceiptPreview(null);
//     setIsReceiptModalOpen(false);
//     setIsManualModalOpen(false);
//   };

//   const getSpendingByCategory = () => {
//     return state.budgets.map((budget) => {
//       const spent = state.transactions
//         .filter((t) => t.category === budget.category)
//         .reduce((sum, t) => sum + t.amount, 0);
//       return {
//         category: budget.category,
//         spent,
//         limit: budget.limit,
//         percentage: budget.limit > 0 ? (spent / budget.limit) * 100 : 0,
//       };
//     });
//   };

//   const getRecentTransactions = () => {
//     return state.transactions.slice(-5).reverse();
//   };

//   return (
//     <div className="min-h-screen bg-background p-4 md:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
//             Budget Tracker
//           </h1>
//           <p className="text-muted-foreground">
//             Track your expenses with receipt scanning
//           </p>
//         </div>

//         {/* Overview Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
//           <Card className="bg-gradient-primary text-white shadow-glow">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
//               <CardTitle className="text-sm font-medium">
//                 Total Budget
//               </CardTitle>
//               <Target className="h-5 w-5" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">${state.totalBudget}</div>
//             </CardContent>
//           </Card>

//           <Card className="bg-gradient-secondary text-white shadow-glow">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
//               <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
//               <DollarSign className="h-5 w-5" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">
//                 ${state.totalSpent.toFixed(2)}
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="shadow-elegant">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
//               <CardTitle className="text-sm font-medium">Remaining</CardTitle>
//               <TrendingUp className="h-5 w-5 text-success" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold text-success">
//                 ${Math.max(0, state.totalBudget - state.totalSpent).toFixed(2)}
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="shadow-elegant">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
//               <CardTitle className="text-sm font-medium">
//                 Transactions
//               </CardTitle>
//               <Receipt className="h-5 w-5 text-info" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">
//                 {state.transactions.length}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Action Buttons */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
//           <Dialog
//             open={isReceiptModalOpen}
//             onOpenChange={setIsReceiptModalOpen}
//           >
//             <DialogTrigger asChild>
//               <Card className="hover-scale cursor-pointer group transition-all duration-300 hover:shadow-glow">
//                 <CardContent className="flex items-center justify-center p-8">
//                   <div className="text-center">
//                     <Camera className="h-16 w-16 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
//                     <h3 className="text-2xl font-bold mb-2">
//                       📷 Upload Receipt
//                     </h3>
//                     <p className="text-muted-foreground">
//                       Scan receipt photos to add expenses
//                     </p>
//                   </div>
//                 </CardContent>
//               </Card>
//             </DialogTrigger>
//             <DialogContent className="max-w-2xl">
//               <DialogHeader>
//                 <DialogTitle className="flex items-center gap-2">
//                   <Camera className="h-5 w-5" />
//                   Upload Receipt Photo
//                 </DialogTitle>
//               </DialogHeader>
//               <div className="space-y-6">
//                 <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
//                   {receiptPreview ? (
//                     <div className="space-y-4">
//                       <img
//                         src={receiptPreview}
//                         alt="Receipt preview"
//                         className="max-w-sm mx-auto rounded-lg shadow-md"
//                       />
//                       <p className="text-sm text-muted-foreground">
//                         Receipt uploaded successfully!
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="space-y-4">
//                       <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
//                       <div>
//                         <p className="text-lg font-medium">
//                           Upload a receipt photo
//                         </p>
//                         <p className="text-sm text-muted-foreground">
//                           Take a photo or select from your device
//                         </p>
//                       </div>
//                     </div>
//                   )}

//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleReceiptUpload}
//                     className="hidden"
//                     id="receipt-upload"
//                   />
//                   <Label htmlFor="receipt-upload">
//                     <Button variant="outline" className="mt-4" asChild>
//                       <span className="cursor-pointer">
//                         {receiptPreview ? "Change Photo" : "Choose Photo"}
//                       </span>
//                     </Button>
//                   </Label>
//                 </div>

//                 {receiptPreview && (
//                   <>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div>
//                         <Label htmlFor="amount">Amount ($)</Label>
//                         <Input
//                           id="amount"
//                           type="number"
//                           step="0.01"
//                           value={newTransaction.amount}
//                           onChange={(e) =>
//                             setNewTransaction((prev) => ({
//                               ...prev,
//                               amount: e.target.value,
//                             }))
//                           }
//                           placeholder="0.00"
//                         />
//                       </div>
//                       <div>
//                         <Label htmlFor="category">Category</Label>
//                         <select
//                           id="category"
//                           value={newTransaction.category}
//                           onChange={(e) =>
//                             setNewTransaction((prev) => ({
//                               ...prev,
//                               category: e.target.value,
//                             }))
//                           }
//                           className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
//                         >
//                           <option value="">Select category</option>
//                           {state.categories.map((cat) => (
//                             <option key={cat} value={cat}>
//                               {cat}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                       <div>
//                         <Label htmlFor="description">Description</Label>
//                         <Input
//                           id="description"
//                           value={newTransaction.description}
//                           onChange={(e) =>
//                             setNewTransaction((prev) => ({
//                               ...prev,
//                               description: e.target.value,
//                             }))
//                           }
//                           placeholder="Enter description"
//                         />
//                       </div>
//                     </div>

//                     <Button onClick={addTransaction} className="w-full">
//                       Add Transaction
//                     </Button>
//                   </>
//                 )}
//               </div>
//             </DialogContent>
//           </Dialog>

//           <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
//             <DialogTrigger asChild>
//               <Card className="hover-scale cursor-pointer group transition-all duration-300 hover:shadow-glow">
//                 <CardContent className="flex items-center justify-center p-8">
//                   <div className="text-center">
//                     <Edit className="h-16 w-16 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
//                     <h3 className="text-2xl font-bold mb-2">✏️ Manual Entry</h3>
//                     <p className="text-muted-foreground">
//                       Enter purchase details manually
//                     </p>
//                   </div>
//                 </CardContent>
//               </Card>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle className="flex items-center gap-2">
//                   <Plus className="h-5 w-5" />
//                   Add Transaction Manually
//                 </DialogTitle>
//               </DialogHeader>
//               <div className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="manual-amount">Amount ($)</Label>
//                     <Input
//                       id="manual-amount"
//                       type="number"
//                       step="0.01"
//                       value={newTransaction.amount}
//                       onChange={(e) =>
//                         setNewTransaction((prev) => ({
//                           ...prev,
//                           amount: e.target.value,
//                         }))
//                       }
//                       placeholder="0.00"
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="manual-category">Category</Label>
//                     <select
//                       id="manual-category"
//                       value={newTransaction.category}
//                       onChange={(e) =>
//                         setNewTransaction((prev) => ({
//                           ...prev,
//                           category: e.target.value,
//                         }))
//                       }
//                       className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
//                     >
//                       <option value="">Select category</option>
//                       {state.categories.map((cat) => (
//                         <option key={cat} value={cat}>
//                           {cat}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//                 <div>
//                   <Label htmlFor="manual-description">Description</Label>
//                   <Input
//                     id="manual-description"
//                     value={newTransaction.description}
//                     onChange={(e) =>
//                       setNewTransaction((prev) => ({
//                         ...prev,
//                         description: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter description"
//                   />
//                 </div>
//                 <Button onClick={addTransaction} className="w-full">
//                   Add Transaction
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>

//         {/* Dashboard Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Recent Transactions */}
//           <Card className="shadow-elegant">
//             <CardHeader className="flex flex-row items-center justify-between">
//               <CardTitle className="flex items-center gap-2">
//                 <History className="h-5 w-5" />
//                 Recent Transactions
//               </CardTitle>
//               <Button variant="ghost" size="sm" className="text-primary">
//                 View All <ArrowRight className="h-4 w-4 ml-1" />
//               </Button>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {getRecentTransactions().length === 0 ? (
//                   <div className="text-center py-8">
//                     <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
//                     <p className="text-muted-foreground">No transactions yet</p>
//                     <p className="text-sm text-muted-foreground">
//                       Upload a receipt or add manually to get started
//                     </p>
//                   </div>
//                 ) : (
//                   getRecentTransactions().map((transaction) => (
//                     <div
//                       key={transaction.id}
//                       className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
//                     >
//                       <div className="flex items-center gap-3">
//                         {transaction.receipt ? (
//                           <img
//                             src={transaction.receipt}
//                             alt="Receipt"
//                             className="w-10 h-10 object-cover rounded border"
//                           />
//                         ) : (
//                           <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
//                             <Receipt className="h-5 w-5 text-muted-foreground" />
//                           </div>
//                         )}
//                         <div>
//                           <p className="font-medium text-sm">
//                             {transaction.description}
//                           </p>
//                           <p className="text-xs text-muted-foreground">
//                             {transaction.category} •{" "}
//                             {new Date(transaction.date).toLocaleDateString()}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-semibold text-destructive">
//                           -${transaction.amount.toFixed(2)}
//                         </p>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Monthly Spending Chart */}
//           <Card className="shadow-elegant">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <PieChart className="h-5 w-5" />
//                 Monthly Budget Analysis
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-6">
//                 {getSpendingByCategory().map((item) => (
//                   <div key={item.category} className="space-y-3">
//                     <div className="flex justify-between items-center">
//                       <span className="font-medium">{item.category}</span>
//                       <div className="text-right">
//                         <div className="text-sm font-semibold">
//                           ${item.spent.toFixed(2)} / ${item.limit.toFixed(2)}
//                         </div>
//                         <div
//                           className={`text-xs ${
//                             item.percentage > 90
//                               ? "text-destructive"
//                               : item.percentage > 70
//                               ? "text-warning"
//                               : "text-success"
//                           }`}
//                         >
//                           {item.percentage.toFixed(0)}% used
//                         </div>
//                       </div>
//                     </div>
//                     <div className="space-y-1">
//                       <Progress
//                         value={Math.min(100, item.percentage)}
//                         className="h-2"
//                       />
//                       {item.percentage > 100 && (
//                         <div className="text-xs text-destructive font-medium">
//                           Over budget by ${(item.spent - item.limit).toFixed(2)}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}

//                 {state.budgets.length === 0 && (
//                   <div className="text-center py-8">
//                     <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
//                     <p className="text-muted-foreground">
//                       No spending data yet
//                     </p>
//                     <p className="text-sm text-muted-foreground">
//                       Add transactions to see your budget analysis
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BudgetDashboard;

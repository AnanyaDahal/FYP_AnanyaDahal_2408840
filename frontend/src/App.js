// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import Layout from "./pages/Layout";
// import Dashboard from "./pages/Dashboard";
// import History from "./pages/History";
// import Report from "./pages/Report";
// import Login from "./pages/login"; 
// import Signup from "./pages/signup"; 
// import ForgotPassword from "./pages/forgotpassword"; 

// function App() {
//   return (
//     <Router>
//       <Routes>
        
//         <Route path="/" element={<Navigate to="/login" />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />
//         <Route path="/forgot-password" element={<ForgotPassword />} />

        
//         <Route element={<Layout />}>
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/history" element={<History />} />
//           <Route path="/report/:id" element={<Report />} />
//         </Route>
//       </Routes>
//     </Router>
//   );
// }

// export default App;




import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
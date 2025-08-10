# Student-Data-Dashboard
🎓 Student Dashboard

An interactive web-based dashboard for managing and visualizing student data from an Excel file. This project allows you to upload student records, view them in a dynamic table or card layout, and perform various actions like filtering, sorting, and exporting.

## ✨ Features

- **📂 Excel File Upload**: Easily upload student data in `.xlsx` or `.xls` format.
- **📊 Data Analytics**: Visualize key metrics with interactive charts for branch distribution, GPA spread, and year-wise student count.
- **🔍 Advanced Filtering & Search**: Filter students by branch, year, and search for specific details in real-time.
- **📝 Data Validation**: Automatically validate student entries for correct format (e.g., valid email, GPA range, English characters). Invalid entries are flagged and separated for review.
- **✅ Incorrect Entry Management**: View and correct invalid entries in a dedicated modal. Validated entries can be added to the main student list.
- **➕ Add New Student**: Manually add new student records through an intuitive modal form.
- **💾 Local Storage Persistence**: Student data is saved to your browser's local storage, so it persists even after a page refresh.
- **👥 Multiple Views**: Toggle between a detailed table view and a clean card-based layout.
- **📤 Export Functionality**: Export all filtered or selected student data to a new Excel file.
- **📧 Email Tool**: Select multiple students and send a group email directly from the dashboard.
- **🖱️ Interactive UI**: A clean, modern interface with a responsive design and visual cues like cursor pointers and colored badges.

## 🚀 Technologies Used

- **JavaScript (ES6+)**: Core logic for data handling, DOM manipulation, and dynamic features.
- **HTML5 & CSS3**: Semantic markup and modern styling for a responsive and user-friendly interface.
- **SheetJS (xlsx.js)**: A powerful library for reading and parsing Excel files directly in the browser.
- **Chart.js**: A flexible library for creating the data visualization charts in the analytics section.

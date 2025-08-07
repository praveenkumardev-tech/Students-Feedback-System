// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { useAuth } from '../contexts/AuthContext';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { Label } from './ui/label';
// import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import { Badge } from './ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import { Alert, AlertDescription } from './ui/alert';
// import { Plus, Trash2, Download, Upload, Link, Copy, Loader2, LogOut } from 'lucide-react';

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// const API = `${BACKEND_URL}/api`;

// const AdminView = () => {
//   const { user, logout } = useAuth();
//   const [forms, setForms] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
  
//   const [newForm, setNewForm] = useState({
//     title: '',
//     year: '',
//     section: '',
//     department: '',
//     subjects: [''],
//     evaluation_criteria: ['']
//   });

//   useEffect(() => {
//     fetchForms();
//   }, []);

//   const fetchForms = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${API}/forms`);
//       setForms(response.data);
//       setError('');
//     } catch (error) {
//       console.error('Failed to fetch forms:', error);
//       setError('Failed to load forms. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addSubject = () => {
//     setNewForm({
//       ...newForm,
//       subjects: [...newForm.subjects, '']
//     });
//   };

//   const removeSubject = (index) => {
//     if (newForm.subjects.length > 1) {
//       const updatedSubjects = newForm.subjects.filter((_, i) => i !== index);
//       setNewForm({
//         ...newForm,
//         subjects: updatedSubjects
//       });
//     }
//   };

//   const updateSubject = (index, value) => {
//     const updatedSubjects = [...newForm.subjects];
//     updatedSubjects[index] = value;
//     setNewForm({
//       ...newForm,
//       subjects: updatedSubjects
//     });
//   };

//   const addCriteria = () => {
//     setNewForm({
//       ...newForm,
//       evaluation_criteria: [...newForm.evaluation_criteria, '']
//     });
//   };

//   const removeCriteria = (index) => {
//     if (newForm.evaluation_criteria.length > 1) {
//       const updatedCriteria = newForm.evaluation_criteria.filter((_, i) => i !== index);
//       setNewForm({
//         ...newForm,
//         evaluation_criteria: updatedCriteria
//       });
//     }
//   };

//   const updateCriteria = (index, value) => {
//     const updatedCriteria = [...newForm.evaluation_criteria];
//     updatedCriteria[index] = value;
//     setNewForm({
//       ...newForm,
//       evaluation_criteria: updatedCriteria
//     });
//   };

//   const createForm = async () => {
//     const { title, year, section, department, subjects, evaluation_criteria } = newForm;
    
//     if (!title.trim() || !year.trim() || !section.trim() || !department.trim()) {
//       setError('Please fill in all required fields (Title, Year, Section, Department)');
//       return;
//     }

//     const validSubjects = subjects.filter(s => s.trim() !== '');
//     const validCriteria = evaluation_criteria.filter(c => c.trim() !== '');

//     if (validSubjects.length === 0 || validCriteria.length === 0) {
//       setError('Please add at least one subject and one evaluation criteria');
//       return;
//     }

//     try {
//       setSubmitting(true);
//       setError('');
      
//       const formData = {
//         title: title.trim(),
//         year: year.trim(),
//         section: section.trim(),
//         department: department.trim(),
//         subjects: validSubjects,
//         evaluation_criteria: validCriteria
//       };

//       const response = await axios.post(`${API}/forms`, formData);
      
//       // Reset form
//       setNewForm({
//         title: '',
//         year: '',
//         section: '',
//         department: '',
//         subjects: [''],
//         evaluation_criteria: ['']
//       });

//       setSuccess(`Form created successfully! Share this link: ${response.data.shareable_link}`);
      
//       // Refresh forms list
//       await fetchForms();
      
//     } catch (error) {
//       console.error('Failed to create form:', error);
//       setError(error.response?.data?.detail || 'Failed to create form. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text).then(() => {
//       setSuccess('Link copied to clipboard!');
//       setTimeout(() => setSuccess(''), 3000);
//     });
//   };

//   const exportFormData = async (formId) => {
//     try {
//       const response = await axios.get(`${API}/forms/${formId}/feedback`);
//       const data = response.data;

//       if (data.feedbacks.length === 0) {
//         setError('No feedback data to export for this form.');
//         return;
//       }

//       const workbook = XLSX.utils.book_new();

//       // Create summary sheet
//       const summaryData = [
//         [`Feedback Summary - ${data.form_title}`],
//         [`${data.year} ${data.department} - Section ${data.section}`],
//         [`Total Responses: ${data.total_responses}`],
//         [''],
//         ['Subject-wise Average Ratings:'],
//         ...Object.entries(data.average_ratings_per_subject).map(([subject, rating]) => [
//           subject, rating.toFixed(2)
//         ]),
//         [''],
//         ['Individual Student Responses:'],
//         ['Student ID', 'Student Name', 'Submitted On', 'Comments', ...Object.keys(data.average_ratings_per_subject)]
//       ];

//       // Add individual responses
//       data.feedbacks.forEach(feedback => {
//         const row = [
//           feedback.student_id,
//           feedback.student_name || 'Not provided',
//           new Date(feedback.submitted_at).toLocaleString(),
//           feedback.comments || 'No comments'
//         ];
        
//         // Add average ratings for each subject
//         Object.keys(data.average_ratings_per_subject).forEach(subject => {
//           row.push(feedback.averages[subject] ? feedback.averages[subject].toFixed(2) : 'N/A');
//         });
        
//         summaryData.push(row);
//       });

//       const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
//       XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

//       // Create detailed sheet with all ratings
//       if (data.feedbacks.length > 0) {
//         const firstFeedback = data.feedbacks[0];
//         const subjects = Object.keys(firstFeedback.ratings);
//         const criteria = Object.keys(firstFeedback.ratings[subjects[0]] || {});

//         const detailedData = [
//           [`Detailed Feedback - ${data.form_title}`],
//           [`${data.year} ${data.department} - Section ${data.section}`],
//           [''],
//           ['Student ID', 'Student Name', 'Submitted On', ...subjects.flatMap(subject => 
//             criteria.map(criterion => `${subject} - ${criterion}`)
//           ), 'Comments']
//         ];

//         data.feedbacks.forEach(feedback => {
//           const row = [
//             feedback.student_id,
//             feedback.student_name || 'Not provided',
//             new Date(feedback.submitted_at).toLocaleString()
//           ];
          
//           subjects.forEach(subject => {
//             criteria.forEach(criterion => {
//               row.push(feedback.ratings[subject]?.[criterion] || 'N/A');
//             });
//           });
          
//           row.push(feedback.comments || 'No comments');
//           detailedData.push(row);
//         });

//         const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
//         XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed');
//       }

//       const fileName = `Feedback_${data.year}_${data.department}_${data.section}_${new Date().toISOString().split('T')[0]}.xlsx`;
//       XLSX.writeFile(workbook, fileName);
      
//       setSuccess('Feedback data exported successfully!');
//       setTimeout(() => setSuccess(''), 3000);
      
//     } catch (error) {
//       console.error('Failed to export data:', error);
//       setError('Failed to export data. Please try again.');
//     }
//   };

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const workbook = XLSX.read(e.target.result, { type: 'binary' });
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];
//         const data = XLSX.utils.sheet_to_json(sheet);

//         console.log('Uploaded feedback data:', data);
//         setSuccess('Feedback file uploaded successfully!');
//         setTimeout(() => setSuccess(''), 3000);
//       } catch (error) {
//         console.error('Error reading file:', error);
//         setError('Error reading file. Please ensure it\'s a valid Excel file.');
//       }
//     };
//     reader.readAsBinaryString(file);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
//           <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <Card className="mb-8">
//           <CardHeader>
//             <div className="flex justify-between items-center">
//               <div>
//                 <CardTitle className="text-2xl font-bold text-gray-900">
//                   Admin Dashboard
//                 </CardTitle>
//                 <p className="text-gray-600">
//                   Welcome, {user?.username} - Manage feedback forms and view submissions
//                 </p>
//               </div>
//               <Button variant="outline" onClick={logout} className="text-red-600 hover:text-red-700">
//                 <LogOut className="h-4 w-4 mr-2" />
//                 Logout
//               </Button>
//             </div>
//           </CardHeader>
//         </Card>

//         {/* Alerts */}
//         {error && (
//           <Alert variant="destructive" className="mb-4">
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {success && (
//           <Alert className="mb-4 border-green-200 bg-green-50">
//             <AlertDescription className="text-green-800">{success}</AlertDescription>
//           </Alert>
//         )}

//         <Tabs defaultValue="create" className="space-y-6">
//           <TabsList className="grid w-full grid-cols-4">
//             <TabsTrigger value="create">Create Form</TabsTrigger>
//             <TabsTrigger value="forms">Manage Forms ({forms.length})</TabsTrigger>
//             <TabsTrigger value="upload">Upload Data</TabsTrigger>
//             <TabsTrigger value="export">Export Data</TabsTrigger>
//           </TabsList>

//           {/* Create New Form */}
//           <TabsContent value="create">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Create New Feedback Form</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="title">Form Title *</Label>
//                     <Input
//                       id="title"
//                       placeholder="e.g., Mid-Semester Feedback"
//                       value={newForm.title}
//                       onChange={(e) => setNewForm({...newForm, title: e.target.value})}
//                       disabled={submitting}
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="department">Department *</Label>
//                     <Input
//                       id="department"
//                       placeholder="e.g., ECE, CSE, MECH"
//                       value={newForm.department}
//                       onChange={(e) => setNewForm({...newForm, department: e.target.value})}
//                       disabled={submitting}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="year">Year *</Label>
//                     <Input
//                       id="year"
//                       placeholder="e.g., 3rd Year, 4th Year"
//                       value={newForm.year}
//                       onChange={(e) => setNewForm({...newForm, year: e.target.value})}
//                       disabled={submitting}
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="section">Section *</Label>
//                     <Input
//                       id="section"
//                       placeholder="e.g., A, B, C"
//                       value={newForm.section}
//                       onChange={(e) => setNewForm({...newForm, section: e.target.value})}
//                       disabled={submitting}
//                     />
//                   </div>
//                 </div>

//                 {/* Subjects */}
//                 <div>
//                   <Label className="text-lg font-medium">Subjects</Label>
//                   <div className="space-y-2 mt-2">
//                     {newForm.subjects.map((subject, index) => (
//                       <div key={index} className="flex gap-2">
//                         <Input
//                           placeholder={`Subject ${index + 1}`}
//                           value={subject}
//                           onChange={(e) => updateSubject(index, e.target.value)}
//                           className="flex-1"
//                           disabled={submitting}
//                         />
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="icon"
//                           onClick={() => removeSubject(index)}
//                           disabled={newForm.subjects.length === 1 || submitting}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}
//                     <Button 
//                       type="button" 
//                       variant="outline" 
//                       onClick={addSubject} 
//                       className="w-full"
//                       disabled={submitting}
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Subject
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Evaluation Criteria */}
//                 <div>
//                   <Label className="text-lg font-medium">Evaluation Criteria</Label>
//                   <div className="space-y-2 mt-2">
//                     {newForm.evaluation_criteria.map((criteria, index) => (
//                       <div key={index} className="flex gap-2">
//                         <Input
//                           placeholder={`Evaluation criteria ${index + 1}`}
//                           value={criteria}
//                           onChange={(e) => updateCriteria(index, e.target.value)}
//                           className="flex-1"
//                           disabled={submitting}
//                         />
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="icon"
//                           onClick={() => removeCriteria(index)}
//                           disabled={newForm.evaluation_criteria.length === 1 || submitting}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}
//                     <Button 
//                       type="button" 
//                       variant="outline" 
//                       onClick={addCriteria} 
//                       className="w-full"
//                       disabled={submitting}
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Criteria
//                     </Button>
//                   </div>
//                 </div>

//                 <Button onClick={createForm} className="w-full" disabled={submitting}>
//                   {submitting ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Creating Form...
//                     </>
//                   ) : (
//                     'Create Feedback Form'
//                   )}
//                 </Button>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Manage Forms */}
//           <TabsContent value="forms">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Created Forms</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {forms.length === 0 ? (
//                   <p className="text-gray-500 text-center py-8">No forms created yet</p>
//                 ) : (
//                   <div className="grid gap-4">
//                     {forms.map(form => (
//                       <div key={form.id} className="p-4 border rounded-lg bg-white">
//                         <div className="flex justify-between items-start mb-2">
//                           <div>
//                             <h3 className="font-semibold text-lg">{form.title}</h3>
//                             <p className="text-blue-600 font-medium">
//                               {form.year} {form.department} - Section {form.section}
//                             </p>
//                             <p className="text-sm text-gray-500">
//                               Created: {new Date(form.created_at).toLocaleString()}
//                             </p>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <Badge variant="secondary">
//                               {form.response_count} responses
//                             </Badge>
//                           </div>
//                         </div>
                        
//                         <div className="mb-3">
//                           <p className="text-sm font-medium text-gray-700 mb-1">Subjects:</p>
//                           <div className="flex flex-wrap gap-1">
//                             {form.subjects.map((subject, index) => (
//                               <Badge key={index} variant="outline">{subject}</Badge>
//                             ))}
//                           </div>
//                         </div>

//                         <div className="mb-3">
//                           <p className="text-sm font-medium text-gray-700 mb-1">
//                             Evaluation Criteria: {form.evaluation_criteria.length} items
//                           </p>
//                         </div>

//                         <div className="flex gap-2 flex-wrap">
//                           <Button 
//                             variant="outline" 
//                             size="sm"
//                             onClick={() => copyToClipboard(form.shareable_link)}
//                           >
//                             <Copy className="h-4 w-4 mr-1" />
//                             Copy Link
//                           </Button>
//                           <Button 
//                             variant="outline" 
//                             size="sm"
//                             onClick={() => exportFormData(form.id)}
//                             disabled={form.response_count === 0}
//                           >
//                             <Download className="h-4 w-4 mr-1" />
//                             Export Data ({form.response_count})
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Upload Data */}
//           <TabsContent value="upload">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Upload Student Feedback Files</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="fileUpload">Select Excel File</Label>
//                     <div className="mt-2">
//                       <input
//                         id="fileUpload"
//                         type="file"
//                         accept=".xlsx,.xls"
//                         onChange={handleFileUpload}
//                         className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                       />
//                     </div>
//                   </div>
                  
//                   <Button variant="outline" className="w-full">
//                     <Upload className="h-4 w-4 mr-2" />
//                     Upload Feedback File
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Export Data */}
//           <TabsContent value="export">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Export All Feedback Data</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <p className="text-gray-600">
//                     Export feedback data for individual forms using the "Export Data" button in the Manage Forms section.
//                   </p>
                  
//                   <div className="bg-blue-50 p-4 rounded-lg">
//                     <p className="text-sm text-blue-800">
//                       <strong>Total Forms:</strong> {forms.length}<br />
//                       <strong>Total Responses:</strong> {forms.reduce((total, form) => total + form.response_count, 0)}
//                     </p>
//                   </div>

//                   <div className="text-center text-gray-500 py-8">
//                     Use the individual export buttons in the "Manage Forms" tab to export data per section.
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// };

// export default AdminView;












































// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { useAuth } from '../contexts/AuthContext';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { Label } from './ui/label';
// import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import { Badge } from './ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import { Alert, AlertDescription } from './ui/alert';
// import { Plus, Trash2, Download, Upload, Link, Copy, Loader2, LogOut } from 'lucide-react';

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// const API = `${BACKEND_URL}/api`;

// const AdminView = () => {
//   const { user, logout } = useAuth();
//   const [forms, setForms] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
  
//   const [newForm, setNewForm] = useState({
//     title: '',
//     year: '',
//     section: '',
//     department: '',
//     subjects: [''],
//     evaluation_criteria: ['']
//   });

//   useEffect(() => {
//     fetchForms();
//   }, []);

//   const fetchForms = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${API}/forms`);
//       setForms(response.data);
//       setError('');
//     } catch (error) {
//       console.error('Failed to fetch forms:', error);
//       setError('Failed to load forms. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addSubject = () => {
//     setNewForm({
//       ...newForm,
//       subjects: [...newForm.subjects, '']
//     });
//   };

//   const removeSubject = (index) => {
//     if (newForm.subjects.length > 1) {
//       const updatedSubjects = newForm.subjects.filter((_, i) => i !== index);
//       setNewForm({
//         ...newForm,
//         subjects: updatedSubjects
//       });
//     }
//   };

//   const updateSubject = (index, value) => {
//     const updatedSubjects = [...newForm.subjects];
//     updatedSubjects[index] = value;
//     setNewForm({
//       ...newForm,
//       subjects: updatedSubjects
//     });
//   };

//   const addCriteria = () => {
//     setNewForm({
//       ...newForm,
//       evaluation_criteria: [...newForm.evaluation_criteria, '']
//     });
//   };

//   const removeCriteria = (index) => {
//     if (newForm.evaluation_criteria.length > 1) {
//       const updatedCriteria = newForm.evaluation_criteria.filter((_, i) => i !== index);
//       setNewForm({
//         ...newForm,
//         evaluation_criteria: updatedCriteria
//       });
//     }
//   };

//   const updateCriteria = (index, value) => {
//     const updatedCriteria = [...newForm.evaluation_criteria];
//     updatedCriteria[index] = value;
//     setNewForm({
//       ...newForm,
//       evaluation_criteria: updatedCriteria
//     });
//   };

//   const createForm = async () => {
//     const { title, year, section, department, subjects, evaluation_criteria } = newForm;
    
//     if (!title.trim() || !year.trim() || !section.trim() || !department.trim()) {
//       setError('Please fill in all required fields (Title, Year, Section, Department)');
//       return;
//     }

//     const validSubjects = subjects.filter(s => s.trim() !== '');
//     const validCriteria = evaluation_criteria.filter(c => c.trim() !== '');

//     if (validSubjects.length === 0 || validCriteria.length === 0) {
//       setError('Please add at least one subject and one evaluation criteria');
//       return;
//     }

//     try {
//       setSubmitting(true);
//       setError('');
      
//       const formData = {
//         title: title.trim(),
//         year: year.trim(),
//         section: section.trim(),
//         department: department.trim(),
//         subjects: validSubjects,
//         evaluation_criteria: validCriteria
//       };

//       const response = await axios.post(`${API}/forms`, formData);
      
//       // Reset form
//       setNewForm({
//         title: '',
//         year: '',
//         section: '',
//         department: '',
//         subjects: [''],
//         evaluation_criteria: ['']
//       });

//       setSuccess(`Form created successfully! Share this link: ${response.data.shareable_link}`);
      
//       // Refresh forms list
//       await fetchForms();
      
//     } catch (error) {
//       console.error('Failed to create form:', error);
//       setError(error.response?.data?.detail || 'Failed to create form. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text).then(() => {
//       setSuccess('Link copied to clipboard!');
//       setTimeout(() => setSuccess(''), 3000);
//     });
//   };

//   const exportFormData = async (formId) => {
//     try {
//       const response = await axios.get(`${API}/forms/${formId}/feedback`);
//       const data = response.data;

//       if (data.feedbacks.length === 0) {
//         setError('No feedback data to export for this form.');
//         return;
//       }

//       const workbook = XLSX.utils.book_new();

//       // Create summary sheet
//       const summaryData = [
//         [`Feedback Summary - ${data.form_title}`],
//         [`${data.year} ${data.department} - Section ${data.section}`],
//         [`Total Responses: ${data.total_responses}`],
//         [''],
//         ['Subject-wise Average Ratings:'],
//         ...Object.entries(data.average_ratings_per_subject).map(([subject, rating]) => [
//           subject, rating.toFixed(2)
//         ]),
//         [''],
//         ['Individual Student Responses:'],
//         ['Student ID', 'Student Name', 'Submitted On', 'Comments', ...Object.keys(data.average_ratings_per_subject)]
//       ];

//       // Add individual responses
//       data.feedbacks.forEach(feedback => {
//         const row = [
//           feedback.student_id,
//           feedback.student_name || 'Not provided',
//           new Date(feedback.submitted_at).toLocaleString(),
//           feedback.comments || 'No comments'
//         ];
        
//         // Add average ratings for each subject
//         Object.keys(data.average_ratings_per_subject).forEach(subject => {
//           row.push(feedback.averages[subject] ? feedback.averages[subject].toFixed(2) : 'N/A');
//         });
        
//         summaryData.push(row);
//       });

//       const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
//       XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

//       // Create detailed sheet with all ratings
//       if (data.feedbacks.length > 0) {
//         const firstFeedback = data.feedbacks[0];
//         const subjects = Object.keys(firstFeedback.ratings);
//         const criteria = Object.keys(firstFeedback.ratings[subjects[0]] || {});

//         const detailedData = [
//           [`Detailed Feedback - ${data.form_title}`],
//           [`${data.year} ${data.department} - Section ${data.section}`],
//           [''],
//           ['Student ID', 'Student Name', 'Submitted On', ...subjects.flatMap(subject => 
//             criteria.map(criterion => `${subject} - ${criterion}`)
//           ), 'Comments']
//         ];

//         data.feedbacks.forEach(feedback => {
//           const row = [
//             feedback.student_id,
//             feedback.student_name || 'Not provided',
//             new Date(feedback.submitted_at).toLocaleString()
//           ];
          
//           subjects.forEach(subject => {
//             criteria.forEach(criterion => {
//               row.push(feedback.ratings[subject]?.[criterion] || 'N/A');
//             });
//           });
          
//           row.push(feedback.comments || 'No comments');
//           detailedData.push(row);
//         });

//         const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
//         XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed');
//       }

//       const fileName = `Feedback_${data.year}_${data.department}_${data.section}_${new Date().toISOString().split('T')[0]}.xlsx`;
//       XLSX.writeFile(workbook, fileName);
      
//       setSuccess('Feedback data exported successfully!');
//       setTimeout(() => setSuccess(''), 3000);
      
//     } catch (error) {
//       console.error('Failed to export data:', error);
//       setError('Failed to export data. Please try again.');
//     }
//   };

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const workbook = XLSX.read(e.target.result, { type: 'binary' });
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];
//         const data = XLSX.utils.sheet_to_json(sheet);

//         console.log('Uploaded feedback data:', data);
//         setSuccess('Feedback file uploaded successfully!');
//         setTimeout(() => setSuccess(''), 3000);
//       } catch (error) {
//         console.error('Error reading file:', error);
//         setError('Error reading file. Please ensure it\'s a valid Excel file.');
//       }
//     };
//     reader.readAsBinaryString(file);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
//           <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <Card className="mb-8">
//           <CardHeader>
//             <div className="flex justify-between items-center">
//               <div>
//                 <CardTitle className="text-2xl font-bold text-gray-900">
//                   Admin Dashboard
//                 </CardTitle>
//                 <p className="text-gray-600">
//                   Welcome, {user?.username} - Manage feedback forms and view submissions
//                 </p>
//               </div>
//               <Button variant="outline" onClick={logout} className="text-red-600 hover:text-red-700">
//                 <LogOut className="h-4 w-4 mr-2" />
//                 Logout
//               </Button>
//             </div>
//           </CardHeader>
//         </Card>

//         {/* Alerts */}
//         {error && (
//           <Alert variant="destructive" className="mb-4">
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {success && (
//           <Alert className="mb-4 border-green-200 bg-green-50">
//             <AlertDescription className="text-green-800">{success}</AlertDescription>
//           </Alert>
//         )}

//         <Tabs defaultValue="create" className="space-y-6">
//           <TabsList className="grid w-full grid-cols-4">
//             <TabsTrigger value="create">Create Form</TabsTrigger>
//             <TabsTrigger value="forms">Manage Forms ({forms.length})</TabsTrigger>
//             <TabsTrigger value="upload">Upload Data</TabsTrigger>
//             <TabsTrigger value="export">Export Data</TabsTrigger>
//           </TabsList>

//           {/* Create New Form */}
//           <TabsContent value="create">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Create New Feedback Form</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="title">Form Title *</Label>
//                     <Input
//                       id="title"
//                       placeholder="e.g., Mid-Semester Feedback"
//                       value={newForm.title}
//                       onChange={(e) => setNewForm({...newForm, title: e.target.value})}
//                       disabled={submitting}
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="department">Department *</Label>
//                     <Input
//                       id="department"
//                       placeholder="e.g., ECE, CSE, MECH"
//                       value={newForm.department}
//                       onChange={(e) => setNewForm({...newForm, department: e.target.value})}
//                       disabled={submitting}
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="year">Year *</Label>
//                     <Input
//                       id="year"
//                       placeholder="e.g., 3rd Year, 4th Year"
//                       value={newForm.year}
//                       onChange={(e) => setNewForm({...newForm, year: e.target.value})}
//                       disabled={submitting}
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="section">Section *</Label>
//                     <Input
//                       id="section"
//                       placeholder="e.g., A, B, C"
//                       value={newForm.section}
//                       onChange={(e) => setNewForm({...newForm, section: e.target.value})}
//                       disabled={submitting}
//                     />
//                   </div>
//                 </div>

//                 {/* Subjects */}
//                 <div>
//                   <Label className="text-lg font-medium">Subjects</Label>
//                   <div className="space-y-2 mt-2">
//                     {newForm.subjects.map((subject, index) => (
//                       <div key={index} className="flex gap-2">
//                         <Input
//                           placeholder={`Subject ${index + 1}`}
//                           value={subject}
//                           onChange={(e) => updateSubject(index, e.target.value)}
//                           className="flex-1"
//                           disabled={submitting}
//                         />
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="icon"
//                           onClick={() => removeSubject(index)}
//                           disabled={newForm.subjects.length === 1 || submitting}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}
//                     <Button 
//                       type="button" 
//                       variant="outline" 
//                       onClick={addSubject} 
//                       className="w-full"
//                       disabled={submitting}
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Subject
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Evaluation Criteria */}
//                 <div>
//                   <Label className="text-lg font-medium">Evaluation Criteria</Label>
//                   <div className="space-y-2 mt-2">
//                     {newForm.evaluation_criteria.map((criteria, index) => (
//                       <div key={index} className="flex gap-2">
//                         <Input
//                           placeholder={`Evaluation criteria ${index + 1}`}
//                           value={criteria}
//                           onChange={(e) => updateCriteria(index, e.target.value)}
//                           className="flex-1"
//                           disabled={submitting}
//                         />
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="icon"
//                           onClick={() => removeCriteria(index)}
//                           disabled={newForm.evaluation_criteria.length === 1 || submitting}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}
//                     <Button 
//                       type="button" 
//                       variant="outline" 
//                       onClick={addCriteria} 
//                       className="w-full"
//                       disabled={submitting}
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Criteria
//                     </Button>
//                   </div>
//                 </div>

//                 <Button onClick={createForm} className="w-full" disabled={submitting}>
//                   {submitting ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Creating Form...
//                     </>
//                   ) : (
//                     'Create Feedback Form'
//                   )}
//                 </Button>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Manage Forms */}
//           <TabsContent value="forms">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Created Forms</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {forms.length === 0 ? (
//                   <p className="text-gray-500 text-center py-8">No forms created yet</p>
//                 ) : (
//                   <div className="grid gap-4">
//                     {forms.map(form => (
//                       <div key={form.id} className="p-4 border rounded-lg bg-white">
//                         <div className="flex justify-between items-start mb-2">
//                           <div>
//                             <h3 className="font-semibold text-lg">{form.title}</h3>
//                             <p className="text-blue-600 font-medium">
//                               {form.year} {form.department} - Section {form.section}
//                             </p>
//                             <p className="text-sm text-gray-500">
//                               Created: {new Date(form.created_at).toLocaleString()}
//                             </p>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <Badge variant="secondary">
//                               {form.response_count} responses
//                             </Badge>
//                           </div>
//                         </div>
                        
//                         <div className="mb-3">
//                           <p className="text-sm font-medium text-gray-700 mb-1">Subjects:</p>
//                           <div className="flex flex-wrap gap-1">
//                             {form.subjects.map((subject, index) => (
//                               <Badge key={index} variant="outline">{subject}</Badge>
//                             ))}
//                           </div>
//                         </div>

//                         <div className="mb-3">
//                           <p className="text-sm font-medium text-gray-700 mb-1">
//                             Evaluation Criteria: {form.evaluation_criteria.length} items
//                           </p>
//                         </div>

//                         <div className="flex gap-2 flex-wrap">
//                           <Button 
//                             variant="outline" 
//                             size="sm"
//                             onClick={() => copyToClipboard(form.shareable_link)}
//                           >
//                             <Copy className="h-4 w-4 mr-1" />
//                             Copy Link
//                           </Button>
//                           <Button 
//                             variant="outline" 
//                             size="sm"
//                             onClick={() => exportFormData(form.id)}
//                             disabled={form.response_count === 0}
//                           >
//                             <Download className="h-4 w-4 mr-1" />
//                             Export Data ({form.response_count})
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Upload Data */}
//           <TabsContent value="upload">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Upload Student Feedback Files</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="fileUpload">Select Excel File</Label>
//                     <div className="mt-2">
//                       <input
//                         id="fileUpload"
//                         type="file"
//                         accept=".xlsx,.xls"
//                         onChange={handleFileUpload}
//                         className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                       />
//                     </div>
//                   </div>
                  
//                   <Button variant="outline" className="w-full">
//                     <Upload className="h-4 w-4 mr-2" />
//                     Upload Feedback File
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Export Data */}
//           <TabsContent value="export">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Export All Feedback Data</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <p className="text-gray-600">
//                     Export feedback data for individual forms using the "Export Data" button in the Manage Forms section.
//                   </p>
                  
//                   <div className="bg-blue-50 p-4 rounded-lg">
//                     <p className="text-sm text-blue-800">
//                       <strong>Total Forms:</strong> {forms.length}<br />
//                       <strong>Total Responses:</strong> {forms.reduce((total, form) => total + form.response_count, 0)}
//                     </p>
//                   </div>

//                   <div className="text-center text-gray-500 py-8">
//                     Use the individual export buttons in the "Manage Forms" tab to export data per section.
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// };

// export default AdminView;











import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Plus, Trash2, Download, Upload, Copy, Loader2, LogOut } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminView = () => {
    const { user, logout } = useAuth();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newForm, setNewForm] = useState({
        title: '',
        year: '',
        section: '',
        department: '',
        subjects: [''],
        evaluation_criteria: ['']
    });

    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/forms`);
            setForms(response.data);
            setError('');
        } catch (error) {
            console.error('Failed to fetch forms:', error);
            setError('Failed to load forms. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Form Creation Helpers (Unchanged) ---
    const addSubject = () => setNewForm({ ...newForm, subjects: [...newForm.subjects, ''] });
    const removeSubject = (index) => {
        if (newForm.subjects.length > 1) {
            setNewForm({ ...newForm, subjects: newForm.subjects.filter((_, i) => i !== index) });
        }
    };
    const updateSubject = (index, value) => {
        const updatedSubjects = [...newForm.subjects];
        updatedSubjects[index] = value;
        setNewForm({ ...newForm, subjects: updatedSubjects });
    };
    const addCriteria = () => setNewForm({ ...newForm, evaluation_criteria: [...newForm.evaluation_criteria, ''] });
    const removeCriteria = (index) => {
        if (newForm.evaluation_criteria.length > 1) {
            setNewForm({ ...newForm, evaluation_criteria: newForm.evaluation_criteria.filter((_, i) => i !== index) });
        }
    };
    const updateCriteria = (index, value) => {
        const updatedCriteria = [...newForm.evaluation_criteria];
        updatedCriteria[index] = value;
        setNewForm({ ...newForm, evaluation_criteria: updatedCriteria });
    };

    // --- Core Functions ---
    const createForm = async () => {
        // (This function's logic is sound and remains unchanged)
        const { title, year, section, department, subjects, evaluation_criteria } = newForm;
        if (!title.trim() || !year.trim() || !section.trim() || !department.trim()) {
            setError('Please fill in all required fields (Title, Year, Section, Department)');
            return;
        }
        const validSubjects = subjects.filter(s => s.trim() !== '');
        const validCriteria = evaluation_criteria.filter(c => c.trim() !== '');
        if (validSubjects.length === 0 || validCriteria.length === 0) {
            setError('Please add at least one subject and one evaluation criteria');
            return;
        }
        try {
            setSubmitting(true);
            setError('');
            const formData = { title: title.trim(), year: year.trim(), section: section.trim(), department: department.trim(), subjects: validSubjects, evaluation_criteria: validCriteria };
            const response = await axios.post(`${API}/forms`, formData);
            setNewForm({ title: '', year: '', section: '', department: '', subjects: [''], evaluation_criteria: [''] });
            setSuccess(`Form created successfully! Share this link: ${response.data.shareable_link}`);
            await fetchForms();
        } catch (error) {
            console.error('Failed to create form:', error);
            setError(error.response?.data?.detail || 'Failed to create form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setSuccess('Link copied to clipboard!');
            setTimeout(() => setSuccess(''), 3000);
        });
    };
    
    // --- NEW: Delete Form Function ---
    const deleteForm = async (formId) => {
        if (!window.confirm('Are you sure you want to delete this form and all its responses? This action cannot be undone.')) {
            return;
        }
        try {
            await axios.delete(`${API}/forms/${formId}`);
            setSuccess('Form deleted successfully.');
            await fetchForms(); // Refresh the list
        } catch (error) {
            console.error('Failed to delete form:', error);
            setError(error.response?.data?.detail || 'Failed to delete form.');
        } finally {
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
        }
    };

    // --- FIXED: Export Logic ---
    
    // Helper to calculate per-student averages, making the export robust.
    const calculateStudentAverages = (feedback, subjects, criteria) => {
        const averages = {};
        subjects.forEach(subject => {
            if (feedback.ratings && feedback.ratings[subject]) {
                const subjectRatings = criteria.map(c => feedback.ratings[subject][c]).filter(v => typeof v === 'number');
                const sum = subjectRatings.reduce((acc, val) => acc + val, 0);
                averages[subject] = subjectRatings.length > 0 ? (sum / subjectRatings.length) : 0;
            } else {
                averages[subject] = 0;
            }
        });
        return averages;
    };
    
    const exportSingleFormData = async (formId) => {
        try {
            const { data } = await axios.get(`${API}/forms/${formId}/feedback`);
            if (!data.feedbacks || data.feedbacks.length === 0) {
                setError('No feedback data to export for this form.');
                return;
            }
    
            const workbook = XLSX.utils.book_new();
            const subjects = data.subjects || [];
            const criteria = data.evaluation_criteria || [];

            // --- Summary Sheet ---
            const summaryData = [
                [`Feedback Summary - ${data.form_title}`],
                [`${data.year} ${data.department} - Section ${data.section}`],
                [`Total Responses: ${data.total_responses}`],
                [''],
                ['Overall Subject-wise Average Ratings:'],
                ...Object.entries(data.average_ratings_per_subject).map(([subject, rating]) => [subject, rating.toFixed(2)]),
                [''],
                ['Individual Student Responses (Averages):'],
                ['Student ID', 'Student Name', 'Submitted On', 'Comments', ...subjects]
            ];
            
            data.feedbacks.forEach(feedback => {
                const studentAverages = calculateStudentAverages(feedback, subjects, criteria);
                const row = [feedback.student_id, feedback.student_name || 'N/A', new Date(feedback.submitted_at).toLocaleString(), feedback.comments || 'N/A'];
                subjects.forEach(subject => row.push(studentAverages[subject] ? studentAverages[subject].toFixed(2) : 'N/A'));
                summaryData.push(row);
            });
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
            // --- Detailed Sheet ---
            const detailedData = [
                ['Detailed Feedback'],
                ['Student ID', 'Student Name', 'Submitted On', ...subjects.flatMap(s => criteria.map(c => `${s} - ${c}`)), 'Comments']
            ];
            data.feedbacks.forEach(feedback => {
                const row = [feedback.student_id, feedback.student_name || 'N/A', new Date(feedback.submitted_at).toLocaleString()];
                subjects.forEach(s => criteria.forEach(c => row.push(feedback.ratings[s]?.[c] ?? 'N/A')));
                row.push(feedback.comments || 'N/A');
                detailedData.push(row);
            });
            const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
            XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed');
    
            XLSX.writeFile(workbook, `Feedback_${data.department}_${data.section}_${new Date().toISOString().split('T')[0]}.xlsx`);
            setSuccess('Feedback data exported successfully!');
        } catch (error) {
            console.error('Failed to export data:', error);
            setError('Failed to export data. The API might be down or the data is corrupted.');
        } finally {
            setTimeout(() => setSuccess(''), 3000);
        }
    };
    
    const exportAllFormsData = async () => {
        if (forms.length === 0) {
            setError('No forms available to export.');
            return;
        }
        setExporting(true);
        setError('');
        const workbook = XLSX.utils.book_new();
    
        try {
            for (const form of forms) {
                if (form.response_count === 0) continue;
    
                const { data } = await axios.get(`${API}/forms/${form.id}/feedback`);
                if (!data.feedbacks || data.feedbacks.length === 0) continue;
    
                const sheetName = `${data.department}_${data.year}_${data.section}`.replace(/[\/\\?*\[\]:]/g, '_').substring(0, 31);
                const subjects = data.subjects || [];
                const criteria = data.evaluation_criteria || [];

                const sheetData = [
                    [`Feedback Summary - ${data.form_title}`],
                    [`Total Responses: ${data.total_responses}`],
                    [''],
                    ['Student ID', 'Student Name', 'Submitted On', 'Comments', ...subjects]
                ];
    
                data.feedbacks.forEach(feedback => {
                    const studentAverages = calculateStudentAverages(feedback, subjects, criteria);
                    const row = [feedback.student_id, feedback.student_name || 'N/A', new Date(feedback.submitted_at).toLocaleString(), feedback.comments || 'N/A'];
                    subjects.forEach(subject => row.push(studentAverages[subject] ? studentAverages[subject].toFixed(2) : 'N/A'));
                    sheetData.push(row);
                });
    
                const sheet = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
            }
    
            if (workbook.SheetNames.length > 0) {
                XLSX.writeFile(workbook, `All_Feedback_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
                setSuccess('All feedback data exported successfully!');
            } else {
                setError('No feedback data found in any forms to export.');
            }
        } catch (error) {
            console.error('Failed to export all data:', error);
            setError('An error occurred while exporting all data. Please try again.');
        } finally {
            setExporting(false);
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
        }
    };

    // --- FIXED: File Upload Handlers ---
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setSuccess(`File "${file.name}" selected. Click the upload button to proceed.`);
            setError('');
        }
    };
    
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first.');
            return;
        }
        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', selectedFile);
    
        try {
            // Note: You must create a backend endpoint at POST /api/feedback/upload
            // This endpoint should accept a multipart/form-data request with a 'file' field.
            const response = await axios.post(`${API}/feedback/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccess(response.data.message || 'File uploaded successfully!');
            setSelectedFile(null);
            document.getElementById('fileUpload').value = ''; // Clear file input
            await fetchForms(); // Refresh data
        } catch (error) {
            console.error('Failed to upload file:', error);
            setError(error.response?.data?.detail || 'Failed to upload file. Check console for details.');
        } finally {
            setUploading(false);
            setTimeout(() => {
                setSuccess('');
                setError('');
            }, 4000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                    <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl font-bold text-gray-900">Admin Dashboard</CardTitle>
                                <p className="text-gray-600">Welcome, {user?.username} - Manage feedback forms and view submissions</p>
                            </div>
                            <Button variant="outline" onClick={logout} className="text-red-600 hover:text-red-700">
                                <LogOut className="h-4 w-4 mr-2" /> Logout
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Alerts */}
                {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert className="mb-4 border-green-200 bg-green-50"><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}
                
                <Tabs defaultValue="forms" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="forms">Manage Forms ({forms.length})</TabsTrigger>
                        <TabsTrigger value="create">Create Form</TabsTrigger>
                        <TabsTrigger value="export">Export All Data</TabsTrigger>
                        <TabsTrigger value="upload">Upload Data</TabsTrigger>
                    </TabsList>

                    {/* Manage Forms */}
                    <TabsContent value="forms">
                        <Card>
                            <CardHeader><CardTitle>Created Forms</CardTitle></CardHeader>
                            <CardContent>
                                {forms.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No forms created yet. Go to the "Create Form" tab.</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {forms.map(form => (
                                            <div key={form.id} className="p-4 border rounded-lg bg-white shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{form.title}</h3>
                                                        <p className="text-blue-600 font-medium">{form.year} {form.department} - Section {form.section}</p>
                                                        <p className="text-sm text-gray-500">Created: {new Date(form.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <Badge variant="secondary">{form.response_count} responses</Badge>
                                                </div>
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">Subjects:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {form.subjects.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-wrap mt-4">
                                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(form.shareable_link)}>
                                                        <Copy className="h-4 w-4 mr-1" /> Copy Link
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => exportSingleFormData(form.id)} disabled={form.response_count === 0}>
                                                        <Download className="h-4 w-4 mr-1" /> Export Data ({form.response_count})
                                                    </Button>
                                                    {/* NEW Delete Button */}
                                                    <Button variant="destructive" size="sm" onClick={() => deleteForm(form.id)}>
                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete Form
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Create New Form */}
                    <TabsContent value="create">
                        {/* The JSX for this tab is correct and needs no changes. */}
                        <Card>
                            <CardHeader><CardTitle>Create New Feedback Form</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                {/* Form Inputs for Title, Dept, Year, Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="title">Form Title *</Label>
                                        <Input id="title" placeholder="e.g., Mid-Semester Feedback" value={newForm.title} onChange={(e) => setNewForm({...newForm, title: e.target.value})} disabled={submitting} />
                                    </div>
                                    <div>
                                        <Label htmlFor="department">Department *</Label>
                                        <Input id="department" placeholder="e.g., ECE, CSE" value={newForm.department} onChange={(e) => setNewForm({...newForm, department: e.target.value})} disabled={submitting} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <Label htmlFor="year">Year *</Label>
                                        <Input id="year" placeholder="e.g., 3rd Year" value={newForm.year} onChange={(e) => setNewForm({...newForm, year: e.target.value})} disabled={submitting} />
                                    </div>
                                    <div>
                                        <Label htmlFor="section">Section *</Label>
                                        <Input id="section" placeholder="e.g., A, B" value={newForm.section} onChange={(e) => setNewForm({...newForm, section: e.target.value})} disabled={submitting} />
                                    </div>
                                </div>

                                {/* Dynamic Subjects */}
                                <div>
                                    <Label className="text-lg font-medium">Subjects</Label>
                                    <div className="space-y-2 mt-2">
                                        {newForm.subjects.map((s, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input placeholder={`Subject ${i + 1}`} value={s} onChange={(e) => updateSubject(i, e.target.value)} disabled={submitting} />
                                                <Button type="button" variant="outline" size="icon" onClick={() => removeSubject(i)} disabled={newForm.subjects.length === 1 || submitting}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" onClick={addSubject} className="w-full" disabled={submitting}><Plus className="h-4 w-4 mr-2" />Add Subject</Button>
                                    </div>
                                </div>

                                {/* Dynamic Criteria */}
                                <div>
                                    <Label className="text-lg font-medium">Evaluation Criteria</Label>
                                    <div className="space-y-2 mt-2">
                                        {newForm.evaluation_criteria.map((c, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input placeholder={`Criteria ${i + 1}`} value={c} onChange={(e) => updateCriteria(i, e.target.value)} disabled={submitting} />
                                                <Button type="button" variant="outline" size="icon" onClick={() => removeCriteria(i)} disabled={newForm.evaluation_criteria.length === 1 || submitting}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" onClick={addCriteria} className="w-full" disabled={submitting}><Plus className="h-4 w-4 mr-2" />Add Criteria</Button>
                                    </div>
                                </div>

                                <Button onClick={createForm} className="w-full" disabled={submitting}>
                                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Feedback Form'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Export All Data */}
                    <TabsContent value="export">
                        <Card>
                            <CardHeader><CardTitle>Export All Feedback Data</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">This will export all feedback from all forms into a single Excel file, with each form on a separate sheet.</p>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Total Forms:</strong> {forms.length}<br />
                                        <strong>Total Responses:</strong> {forms.reduce((total, form) => total + form.response_count, 0)}
                                    </p>
                                </div>
                                <Button onClick={exportAllFormsData} className="w-full" disabled={exporting || forms.length === 0}>
                                    {exporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting All Data...</> : <><Download className="h-4 w-4 mr-2" />Export All Data</>}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* FIXED: Upload Data */}
                    <TabsContent value="upload">
                        <Card>
                            <CardHeader><CardTitle>Upload Feedback File</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">Upload an Excel file with feedback data. Make sure it matches the required format.</p>
                                <div>
                                    <Label htmlFor="fileUpload">Select Excel File (.xlsx, .xls)</Label>
                                    <Input
                                        id="fileUpload"
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileSelect}
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        disabled={uploading}
                                    />
                                </div>
                                <Button onClick={handleUpload} className="w-full" disabled={uploading || !selectedFile}>
                                    {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload File</>}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminView;
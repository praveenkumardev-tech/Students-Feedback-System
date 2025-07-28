import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Download, Upload, Link } from 'lucide-react';

const AdminView = () => {
  const [forms, setForms] = useState([]);
  const [newForm, setNewForm] = useState({
    year: '',
    section: '',
    subjects: [''],
    evaluationCriteria: ['']
  });
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    // Load saved forms and feedbacks from localStorage
    const savedForms = JSON.parse(localStorage.getItem('forms') || '[]');
    const savedFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    setForms(savedForms);
    setFeedbacks(savedFeedbacks);
  }, []);

  const addSubject = () => {
    setNewForm({
      ...newForm,
      subjects: [...newForm.subjects, '']
    });
  };

  const removeSubject = (index) => {
    if (newForm.subjects.length > 1) {
      const updatedSubjects = newForm.subjects.filter((_, i) => i !== index);
      setNewForm({
        ...newForm,
        subjects: updatedSubjects
      });
    }
  };

  const updateSubject = (index, value) => {
    const updatedSubjects = [...newForm.subjects];
    updatedSubjects[index] = value;
    setNewForm({
      ...newForm,
      subjects: updatedSubjects
    });
  };

  const addCriteria = () => {
    setNewForm({
      ...newForm,
      evaluationCriteria: [...newForm.evaluationCriteria, '']
    });
  };

  const removeCriteria = (index) => {
    if (newForm.evaluationCriteria.length > 1) {
      const updatedCriteria = newForm.evaluationCriteria.filter((_, i) => i !== index);
      setNewForm({
        ...newForm,
        evaluationCriteria: updatedCriteria
      });
    }
  };

  const updateCriteria = (index, value) => {
    const updatedCriteria = [...newForm.evaluationCriteria];
    updatedCriteria[index] = value;
    setNewForm({
      ...newForm,
      evaluationCriteria: updatedCriteria
    });
  };

  const createForm = () => {
    if (!newForm.year.trim() || !newForm.section.trim()) {
      alert('Please enter both year and section');
      return;
    }

    const validSubjects = newForm.subjects.filter(s => s.trim() !== '');
    const validCriteria = newForm.evaluationCriteria.filter(c => c.trim() !== '');

    if (validSubjects.length === 0 || validCriteria.length === 0) {
      alert('Please add at least one subject and one evaluation criteria');
      return;
    }

    const formData = {
      id: `form_${Date.now()}`,
      year: newForm.year.trim(),
      section: newForm.section.trim(),
      subjects: validSubjects,
      evaluationCriteria: validCriteria,
      createdAt: new Date().toISOString()
    };

    const updatedForms = [...forms, formData];
    setForms(updatedForms);
    localStorage.setItem('forms', JSON.stringify(updatedForms));

    // Reset form
    setNewForm({
      year: '',
      section: '',
      subjects: [''],
      evaluationCriteria: ['']
    });

    alert(`Form created successfully! Share this link with students:\n${window.location.origin}/#/student/${formData.id}`);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Process the uploaded feedback data
        console.log('Uploaded feedback data:', data);
        alert('Feedback file uploaded successfully!');
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please ensure it\'s a valid Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportAllFeedbacks = () => {
    if (feedbacks.length === 0) {
      alert('No feedback data to export');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Group feedbacks by year and section
    const groupedFeedbacks = feedbacks.reduce((acc, feedback) => {
      const key = `${feedback.year}_${feedback.section}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(feedback);
      return acc;
    }, {});

    Object.keys(groupedFeedbacks).forEach(key => {
      const [year, section] = key.split('_');
      const sectionFeedbacks = groupedFeedbacks[key];

      const worksheetData = [
        [`Feedback Summary - ${year} ${section}`],
        [''],
        ['Student ID', 'Submitted On', 'Overall Average', 'Comments']
      ];

      sectionFeedbacks.forEach(feedback => {
        const overallAvg = Object.values(feedback.averages || {})
          .reduce((sum, avg) => sum + parseFloat(avg), 0) / Object.keys(feedback.averages || {}).length;
        
        worksheetData.push([
          feedback.studentId,
          new Date(feedback.timestamp).toLocaleString(),
          overallAvg.toFixed(2),
          feedback.comments || 'No comments'
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, `${year}_${section}`);
    });

    XLSX.writeFile(workbook, `All_Feedbacks_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getFeedbackCount = (formId) => {
    return feedbacks.filter(f => f.formId === formId).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </CardTitle>
            <p className="text-gray-600">Manage feedback forms and view submissions</p>
          </CardHeader>
        </Card>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Form</TabsTrigger>
            <TabsTrigger value="forms">Manage Forms ({forms.length})</TabsTrigger>
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
          </TabsList>

          {/* Create New Form */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Feedback Form</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      placeholder="e.g., 3rd Year"
                      value={newForm.year}
                      onChange={(e) => setNewForm({...newForm, year: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      placeholder="e.g., A"
                      value={newForm.section}
                      onChange={(e) => setNewForm({...newForm, section: e.target.value})}
                    />
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <Label className="text-lg font-medium">Subjects</Label>
                  <div className="space-y-2 mt-2">
                    {newForm.subjects.map((subject, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Subject ${index + 1}`}
                          value={subject}
                          onChange={(e) => updateSubject(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeSubject(index)}
                          disabled={newForm.subjects.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addSubject} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subject
                    </Button>
                  </div>
                </div>

                {/* Evaluation Criteria */}
                <div>
                  <Label className="text-lg font-medium">Evaluation Criteria</Label>
                  <div className="space-y-2 mt-2">
                    {newForm.evaluationCriteria.map((criteria, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Evaluation criteria ${index + 1}`}
                          value={criteria}
                          onChange={(e) => updateCriteria(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeCriteria(index)}
                          disabled={newForm.evaluationCriteria.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addCriteria} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Criteria
                    </Button>
                  </div>
                </div>

                <Button onClick={createForm} className="w-full">
                  Create Feedback Form
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Forms */}
          <TabsContent value="forms">
            <Card>
              <CardHeader>
                <CardTitle>Created Forms</CardTitle>
              </CardHeader>
              <CardContent>
                {forms.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No forms created yet</p>
                ) : (
                  <div className="grid gap-4">
                    {forms.map(form => (
                      <div key={form.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{form.year} - Section {form.section}</h3>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(form.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {getFeedbackCount(form.id)} responses
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Subjects:</p>
                          <div className="flex flex-wrap gap-1">
                            {form.subjects.map((subject, index) => (
                              <Badge key={index} variant="outline">{subject}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Evaluation Criteria: {form.evaluationCriteria.length} items
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const link = `${window.location.origin}/#/student/${form.id}`;
                              navigator.clipboard.writeText(link);
                              alert('Link copied to clipboard!');
                            }}
                          >
                            <Link className="h-4 w-4 mr-1" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Data */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Student Feedback Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fileUpload">Select Excel File</Label>
                    <div className="mt-2">
                      <input
                        id="fileUpload"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Feedback File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Data */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Export All Feedback Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Export all collected feedback data grouped by year and section to Excel format.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Total Feedbacks:</strong> {feedbacks.length}
                    </p>
                  </div>

                  <Button onClick={exportAllFeedbacks} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Feedbacks to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminView;
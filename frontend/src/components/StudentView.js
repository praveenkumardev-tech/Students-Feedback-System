import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ratingScale } from '../data/mock';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, FileDown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentView = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (formId) {
      fetchFormData();
    } else {
      setError('No form selected. Please use a valid form link.');
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (formData) {
      // Initialize ratings matrix with default values
      const initialRatings = {};
      formData.subjects.forEach(subject => {
        initialRatings[subject] = {};
        formData.evaluation_criteria.forEach(criteria => {
          initialRatings[subject][criteria] = 5; // Default to 5 as shown in UI
        });
      });
      setRatings(initialRatings);
    }
  }, [formData]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/forms/${formId}`);
      setFormData(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to fetch form data:', error);
      if (error.response?.status === 404) {
        setError('Feedback form not found. The form may have been removed or the link is invalid.');
      } else {
        setError('Failed to load feedback form. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (subject, criteria, value) => {
    setRatings(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [criteria]: parseInt(value)
      }
    }));
  };

  const calculateAverage = (subject) => {
    if (!ratings[subject]) return 0;
    const values = Object.values(ratings[subject]);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(1);
  };

  const handleSubmit = async () => {
    if (!studentId.trim()) {
      setError('Please enter your Student ID');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const feedbackData = {
        form_id: formId,
        student_id: studentId.trim(),
        student_name: studentName.trim() || null,
        ratings,
        comments: comments.trim() || null
      };

      await axios.post(`${API}/feedback`, feedbackData);

      // ❌ Export removed — students won't download Excel anymore
      // exportToExcel(feedbackData);

      setSuccess('Feedback submitted successfully!');
      
      // Reset form
      setStudentId('');
      setStudentName('');
      setComments('');
      const initialRatings = {};
      formData.subjects.forEach(subject => {
        initialRatings[subject] = {};
        formData.evaluation_criteria.forEach(criteria => {
          initialRatings[subject][criteria] = 5;
        });
      });
      setRatings(initialRatings);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      if (error.response?.status === 400) {
        setError(error.response.data.detail || 'You have already submitted feedback for this form.');
      } else {
        setError('Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const exportToExcel = (feedbackData) => {
    const workbook = XLSX.utils.book_new();
    
    // Calculate averages for export
    const averages = {};
    formData.subjects.forEach(subject => {
      averages[subject] = calculateAverage(subject);
    });
    
    // Create main feedback sheet
    const worksheetData = [
      ['Student ID', feedbackData.student_id],
      ['Student Name', feedbackData.student_name || 'Not provided'],
      ['Form', formData.title],
      ['Year', formData.year],
      ['Section', formData.section],
      ['Department', formData.department],
      ['Submitted On', new Date().toLocaleString()],
      [''],
      ['Evaluation Criteria', ...formData.subjects],
    ];

    formData.evaluation_criteria.forEach(criteria => {
      const row = [criteria];
      formData.subjects.forEach(subject => {
        row.push(ratings[subject][criteria]);
      });
      worksheetData.push(row);
    });

    // Add averages row
    const averageRow = ['Average Rating'];
    formData.subjects.forEach(subject => {
      averageRow.push(averages[subject]);
    });
    worksheetData.push([''], averageRow);

    // Add comments
    if (comments.trim()) {
      worksheetData.push([''], ['Comments', comments]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback');

    // Download file
    // const fileName = `Feedback_${formData.year}_${formData.department}_${formData.section}_${feedbackData.student_id}.xlsx`;
    // XLSX.writeFile(workbook, fileName);
  };

  const getRatingColor = (value) => {
    const scale = ratingScale.find(s => s.value === value);
    return scale ? scale.color : 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Teacher Feedback Collection System
            </CardTitle>
            <div className="space-y-1">
              <p className="text-gray-600">Submit your feedback for all subjects</p>
              {formData && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-900 font-medium">
                    {formData.title} - {formData.year} {formData.department} - Section {formData.section}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="studentId" className="text-sm font-medium text-gray-700 mb-2 block">
                  Student ID / Roll Number (Required) *
                </Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Enter your Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="studentName" className="text-sm font-medium text-gray-700 mb-2 block">
                  Student Name (Optional)
                </Label>
                <Input
                  id="studentName"
                  type="text"
                  placeholder="Enter your full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Feedback Matrix Table */}
            <div className="mb-8">
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-gray-100 p-3 text-left font-medium text-gray-700 border border-gray-300 w-80">
                          Evaluation Criteria
                        </th>
                        {formData?.subjects.map((subject) => (
                          <th key={subject} className="p-3 text-center font-medium text-gray-700 border border-gray-300 min-w-40">
                            {subject}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formData?.evaluation_criteria.map((criteria) => (
                        <tr key={criteria} className="hover:bg-gray-50">
                          <td className="sticky left-0 bg-white p-3 text-sm text-gray-900 border border-gray-300 font-medium">
                            {criteria}
                          </td>
                          {formData.subjects.map((subject) => (
                            <td key={`${criteria}-${subject}`} className="p-3 border border-gray-300 text-center">
                              <Select
                                value={ratings[subject]?.[criteria]?.toString() || '5'}
                                onValueChange={(value) => handleRatingChange(subject, criteria, value)}
                                disabled={submitting}
                              >
                                <SelectTrigger className={`w-16 h-8 mx-auto text-white font-medium ${getRatingColor(parseInt(ratings[subject]?.[criteria] || 5))}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ratingScale.map(scale => (
                                    <SelectItem key={scale.value} value={scale.value.toString()}>
                                      {scale.value} - {scale.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Average Row */}
                      <tr className="bg-blue-50">
                        <td className="sticky left-0 bg-blue-100 p-3 text-sm font-bold text-gray-900 border border-gray-300">
                          Your Average Rating
                        </td>
                        {formData?.subjects.map(subject => (
                          <td key={`avg-${subject}`} className="p-3 border border-gray-300 text-center">
                            <span className="text-lg font-bold text-blue-600">
                              {calculateAverage(subject)}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mb-8">
              <Label htmlFor="comments" className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Comments (Optional):
              </Label>
              <Textarea
                id="comments"
                placeholder="Any specific suggestions or comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-24"
                disabled={submitting}
              />
            </div>

            {/* Submit Button */}
            <div className="text-center mb-8">
              <Button 
                onClick={handleSubmit} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>

            {/* Rating Scale Legend */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rating Scale:</h4>
              <div className="flex flex-wrap gap-4">
                {ratingScale.map(scale => (
                  <div key={scale.value} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${scale.color}`}></div>
                    <span className="text-sm text-gray-700">
                      {scale.label} ({scale.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentView;
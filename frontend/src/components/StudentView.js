import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { mockFormData, ratingScale } from '../data/mock';
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

const StudentView = () => {
  const { formId } = useParams();
  const [formData, setFormData] = useState(mockFormData);
  const [studentId, setStudentId] = useState('');
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState('');

  useEffect(() => {
    // Initialize ratings matrix with default values
    const initialRatings = {};
    formData.subjects.forEach(subject => {
      initialRatings[subject] = {};
      formData.evaluationCriteria.forEach(criteria => {
        initialRatings[subject][criteria] = 5; // Default to 5 as shown in UI
      });
    });
    setRatings(initialRatings);
  }, [formData]);

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

  const handleSubmit = () => {
    if (!studentId.trim()) {
      alert('Please enter your Student ID');
      return;
    }

    const feedbackData = {
      studentId,
      formId: formData.id,
      year: formData.year,
      section: formData.section,
      timestamp: new Date().toISOString(),
      ratings,
      comments,
      averages: {}
    };

    // Calculate averages for each subject
    formData.subjects.forEach(subject => {
      feedbackData.averages[subject] = calculateAverage(subject);
    });

    // Save to localStorage
    const existingFeedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    existingFeedbacks.push(feedbackData);
    localStorage.setItem('feedbacks', JSON.stringify(existingFeedbacks));

    // Export to Excel
    exportToExcel(feedbackData);

    // Reset form
    setStudentId('');
    setComments('');
    const initialRatings = {};
    formData.subjects.forEach(subject => {
      initialRatings[subject] = {};
      formData.evaluationCriteria.forEach(criteria => {
        initialRatings[subject][criteria] = 5;
      });
    });
    setRatings(initialRatings);

    alert('Feedback submitted successfully! Excel file has been downloaded.');
  };

  const exportToExcel = (feedbackData) => {
    const workbook = XLSX.utils.book_new();
    
    // Create main feedback sheet
    const worksheetData = [
      ['Student ID', feedbackData.studentId],
      ['Year', feedbackData.year],
      ['Section', feedbackData.section],
      ['Submitted On', new Date(feedbackData.timestamp).toLocaleString()],
      [''],
      ['Evaluation Criteria', ...formData.subjects],
    ];

    formData.evaluationCriteria.forEach(criteria => {
      const row = [criteria];
      formData.subjects.forEach(subject => {
        row.push(ratings[subject][criteria]);
      });
      worksheetData.push(row);
    });

    // Add averages row
    const averageRow = ['Average Rating'];
    formData.subjects.forEach(subject => {
      averageRow.push(calculateAverage(subject));
    });
    worksheetData.push([''], averageRow);

    // Add comments
    if (comments.trim()) {
      worksheetData.push([''], ['Comments', comments]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback');

    // Download file
    XLSX.writeFile(workbook, `Feedback_${feedbackData.studentId}.xlsx`);
  };

  const getRatingColor = (value) => {
    const scale = ratingScale.find(s => s.value === value);
    return scale ? scale.color : 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Teacher Feedback Collection System
            </CardTitle>
            <p className="text-gray-600">Submit your feedback for all subjects</p>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label htmlFor="studentId" className="text-sm font-medium text-gray-700 mb-2 block">
                Student ID / Roll Number (Required)
              </Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter your Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Feedback Matrix Table */}
            <div className="mb-8">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-gray-100 p-3 text-left font-medium text-gray-700 border border-gray-300 min-w-80">
                        Evaluation Criteria
                      </th>
                      {formData.subjects.map((subject, index) => (
                        <th key={subject} className="p-3 text-center font-medium text-gray-700 border border-gray-300 min-w-40">
                          {subject}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.evaluationCriteria.map((criteria, criteriaIndex) => (
                      <tr key={criteria} className="hover:bg-gray-50">
                        <td className="sticky left-0 bg-white p-3 text-sm text-gray-900 border border-gray-300 font-medium">
                          {criteria}
                        </td>
                        {formData.subjects.map((subject, subjectIndex) => (
                          <td key={`${criteria}-${subject}`} className="p-3 border border-gray-300 text-center">
                            <Select
                              value={ratings[subject]?.[criteria]?.toString() || '5'}
                              onValueChange={(value) => handleRatingChange(subject, criteria, value)}
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
                      {formData.subjects.map(subject => (
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
              />
            </div>

            {/* Submit Button */}
            <div className="text-center mb-8">
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2">
                Submit Feedback
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
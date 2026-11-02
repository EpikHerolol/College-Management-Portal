import enrollmentService from '../services/enrollment.service.js';

export const registerCourse = async (req, res, next) => {
  try {
    const { courseId, studentId: targetStudentId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'courseId is required.'
      });
    }

    // Determine target student: if student role, use own profile id.
    // If admin, can optionally supply targetStudentId.
    let studentProfileId = req.user.studentProfileId;
    if (req.user.role === 'admin' && targetStudentId) {
      studentProfileId = targetStudentId;
    }

    if (!studentProfileId) {
      return res.status(400).json({
        success: false,
        message: 'No student profile associated with this account.'
      });
    }

    const result = await enrollmentService.registerStudent(studentProfileId, courseId);

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const dropCourse = async (req, res, next) => {
  try {
    const { courseId, studentId: targetStudentId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'courseId is required.'
      });
    }

    let studentProfileId = req.user.studentProfileId;
    if (req.user.role === 'admin' && targetStudentId) {
      studentProfileId = targetStudentId;
    }

    if (!studentProfileId) {
      return res.status(400).json({
        success: false,
        message: 'No student profile associated with this account.'
      });
    }

    const result = await enrollmentService.dropStudentCourse(studentProfileId, courseId);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

export const getMyEnrollments = async (req, res, next) => {
  try {
    const studentProfileId = req.user.studentProfileId;
    if (!studentProfileId) {
      return res.status(400).json({
        success: false,
        message: 'No student profile linked to this user.'
      });
    }

    const enrollments = await enrollmentService.getStudentEnrollments(studentProfileId);
    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (err) {
    next(err);
  }
};

export const getCourseEnrollments = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const students = await enrollmentService.getCourseEnrollments(courseId);
    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
};


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

describe('Frontend UI Components', () => {
  it('Badge renders children and variant styling', () => {
    render(<Badge variant="success">Enrolled</Badge>);
    const el = screen.getByText('Enrolled');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('bg-emerald-50');
  });

  it('Alert renders title, message, and handles close event', () => {
    const handleClose = vi.fn();
    render(
      <Alert
        type="error"
        title="Validation Error"
        message="Course has reached full capacity"
        onClose={handleClose}
      />
    );
    expect(screen.getByText('Validation Error')).toBeInTheDocument();
    expect(screen.getByText('Course has reached full capacity')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Close');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('StatCard displays metric title, value, and subtitle', () => {
    render(
      <StatCard
        title="Total Courses"
        value={12}
        subtitle="Active semester curriculum"
        color="indigo"
      />
    );
    expect(screen.getByText('Total Courses')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Active semester curriculum')).toBeInTheDocument();
  });

  it('Modal renders content when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Dialog">
        <p>Modal body content</p>
      </Modal>
    );
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('ConfirmDialog triggers confirmation handler on button click', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={() => {}}
        onConfirm={handleConfirm}
        title="Confirm Course Drop"
        message="Are you sure you want to drop this course?"
        confirmText="Confirm Drop"
      />
    );
    expect(screen.getByText('Confirm Course Drop')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to drop this course?')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Confirm Drop');
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});


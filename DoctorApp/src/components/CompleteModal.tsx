import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete: (followupDate?: string, consultingFee?: string, paymentType?: string, paymentStatus?: string, remarks?: string) => void;
  patientName?: string;
}

export default function CompleteModal({ visible, onClose, onComplete, patientName }: Props) {
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [consultingFee, setConsultingFee] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentType, setPaymentType] = useState('Offline');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [showCalendar, setShowCalendar] = useState(false);

  const handleClose = () => {
    setShowFollowup(false);
    setFollowupDate('');
    setConsultingFee('');
    setRemarks('');
    setPaymentType('Offline');
    setPaymentStatus('Pending');
    setShowCalendar(false);
    onClose();
  };

  const handleComplete = () => {
    onComplete(showFollowup ? followupDate : undefined, consultingFee, paymentType, paymentStatus, remarks);
    setShowFollowup(false);
    setFollowupDate('');
    setConsultingFee('');
    setRemarks('');
    setPaymentType('Offline');
    setPaymentStatus('Pending');
    setShowCalendar(false);
  };

  const onDateSelect = (day: any) => {
    // day.dateString is YYYY-MM-DD
    const parts = day.dateString.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    setFollowupDate(formatted);
    setShowCalendar(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Appointment Complete</Text>
          <Text style={styles.patientName}>{patientName}</Text>
          
          <Text style={styles.message}>Are you sure to complete this booking?</Text>

          {showFollowup && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="DD/MM/YYYY"
                value={followupDate}
                editable={false}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.calendarIcon}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.dateInput}
              placeholder="Consulting Fee (e.g. 500)"
              value={consultingFee}
              onChangeText={setConsultingFee}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.dateInput}
              placeholder="Remarks (Optional)"
              value={remarks}
              onChangeText={setRemarks}
              placeholderTextColor="#999"
            />
          </View>

          {/* <Text style={styles.sectionLabel}>Payment Type</Text>
          <View style={styles.rowContainer}>
            {['Online', 'Offline'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.toggleBtn, paymentType === type && styles.toggleBtnActive]}
                onPress={() => setPaymentType(type)}
              >
                <Text style={[styles.toggleBtnText, paymentType === type && styles.toggleBtnTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Payment Status</Text>
          <View style={styles.rowContainer}>
            {['Pending', 'Paid', 'Refunds'].map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.toggleBtn, paymentStatus === status && styles.toggleBtnActive]}
                onPress={() => setPaymentStatus(status)}
              >
                <Text style={[styles.toggleBtnText, paymentStatus === status && styles.toggleBtnTextActive]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View> */}

          {showCalendar && (
            <View style={styles.calendarWrapper}>
              <Calendar
                onDayPress={onDateSelect}
                minDate={new Date().toISOString().split('T')[0]}
                theme={{
                  todayTextColor: '#2CA01C',
                  arrowColor: '#2CA01C',
                  selectedDayBackgroundColor: '#2CA01C',
                  selectedDayTextColor: '#ffffff',
                }}
              />
            </View>
          )}
          
          <View style={styles.buttonRow}>
            {!showFollowup && (
              <TouchableOpacity style={[styles.btn, styles.followupBtn]} onPress={() => setShowFollowup(true)}>
                <Text style={styles.btnTextDark}>Follow-up</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.completeBtn]} onPress={handleComplete}>
              <Text style={styles.btnText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  patientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    width:'100%',
    textAlign:'center'
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 25,
    width:'100%',
    textAlign:'center'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  completeBtn: {
    backgroundColor: '#2CA01C',
  },
  cancelBtn: {
    backgroundColor: '#8C8C8C',
  },
  followupBtn: {
    backgroundColor: '#1E90FF', // DodgerBlue or similar for follow-up
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnTextDark: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  dateInput: {
    flex: 1,
    height: 40,
    color: '#333',
  },
  calendarIcon: {
    padding: 5,
  },
  calendarWrapper: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 5,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 5,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#1565c0',
    borderColor: '#1565c0',
  },
  toggleBtnText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
  },
});

import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session, init_db, engine
from app.models.user import User
from app.models.patient import Patient
from app.models.facility import Facility
from app.models.doctor import Doctor
from app.models.bed import Bed
from app.models.medicine import MedicineInventory
from app.models.appointment import Appointment
from app.models.triage_session import TriageSession
from app.models.queue_token import QueueToken
from app.security.password import hash_password


async def seed():
    """Seed the database with comprehensive demo data for the hackathon."""
    await init_db()

    async with async_session() as session:
        # ============================================================
        # 1. USERS (3 demo accounts + 14 doctor accounts + 4 admin accounts)
        # ============================================================
        hashed_pw = hash_password("demo1234")

        # Primary demo accounts
        u_patient = User(email="patient@demo.com", phone="9876543210", hashed_password=hashed_pw, role="PATIENT", full_name="Priya Sharma")
        u_doctor = User(email="doctor@demo.com", phone="9876543211", hashed_password=hashed_pw, role="DOCTOR", full_name="Dr. Rajesh Kumar")
        u_admin = User(email="admin@demo.com", phone="9876543212", hashed_password=hashed_pw, role="FACILITY_ADMIN", full_name="Facility Admin")

        # Additional patient accounts
        u_patient2 = User(email="patient2@demo.com", phone="9876543220", hashed_password=hashed_pw, role="PATIENT", full_name="Amit Verma")
        u_patient3 = User(email="patient3@demo.com", phone="9876543221", hashed_password=hashed_pw, role="PATIENT", full_name="Sunita Devi")

        # Doctor accounts for all facilities
        doc_users = []
        doc_names = [
            ("Dr. Anita Gupta", "9876543213"),
            ("Dr. Sanjay Patel", "9876543214"),
            ("Dr. Meera Nair", "9876543215"),
            ("Dr. Vikram Singh", "9876543216"),
            ("Dr. Pooja Reddy", "9876543217"),
            ("Dr. Arjun Mehta", "9876543218"),
            ("Dr. Kavita Joshi", "9876543219"),
            ("Dr. Ravi Shankar", "9876543222"),
            ("Dr. Deepa Iyer", "9876543223"),
            ("Dr. Suresh Yadav", "9876543224"),
            ("Dr. Nandini Das", "9876543225"),
            ("Dr. Manoj Tiwari", "9876543226"),
            ("Dr. Lakshmi Rao", "9876543227"),
            ("Dr. Arun Chopra", "9876543228"),
        ]
        for i, (name, phone) in enumerate(doc_names):
            u = User(email=f"doctor{i+2}@demo.com", phone=phone, hashed_password=hashed_pw, role="DOCTOR", full_name=name)
            doc_users.append(u)

        all_users = [u_patient, u_doctor, u_admin, u_patient2, u_patient3] + doc_users
        session.add_all(all_users)
        await session.commit()

        for u in all_users:
            await session.refresh(u)

        # ============================================================
        # 2. PATIENTS (3 patient profiles)
        # ============================================================
        p1 = Patient(
            user_id=u_patient.id, full_name="Priya Sharma", dob=date(1990, 5, 15),
            gender="Female", blood_group="B+", abha_id="ABHA-1234-5678-9012",
            emergency_contact_phone="9876500001",
            medical_history='["Mild asthma since childhood", "Vitamin D deficiency"]',
            allergies='["Penicillin", "Dust"]'
        )
        p2 = Patient(
            user_id=u_patient2.id, full_name="Amit Verma", dob=date(1985, 8, 22),
            gender="Male", blood_group="O+", abha_id="ABHA-2345-6789-0123",
            emergency_contact_phone="9876500002",
            medical_history='["Type 2 Diabetes", "Hypertension"]',
            allergies='["Sulfa drugs"]'
        )
        p3 = Patient(
            user_id=u_patient3.id, full_name="Sunita Devi", dob=date(1975, 3, 10),
            gender="Female", blood_group="A+",
            emergency_contact_phone="9876500003",
            medical_history='["Arthritis"]',
            allergies='[]'
        )
        session.add_all([p1, p2, p3])
        await session.commit()
        for p in [p1, p2, p3]:
            await session.refresh(p)

        # ============================================================
        # 3. FACILITIES (5 healthcare facilities near Delhi NCR)
        # ============================================================
        facilities_data = [
            {
                "name": "AIIMS Delhi",
                "facility_type": "Hospital",
                "address": "Sri Aurobindo Marg, Ansari Nagar, New Delhi - 110029",
                "latitude": 28.5672,
                "longitude": 77.2100,
                "phone": "011-26588500",
                "email": "aiims@demo.com",
                "emergency_services": True,
                "operating_hours": "24/7",
            },
            {
                "name": "Safdarjung Hospital",
                "facility_type": "Hospital",
                "address": "Safdarjung Enclave, New Delhi - 110029",
                "latitude": 28.5681,
                "longitude": 77.2065,
                "phone": "011-26707437",
                "email": "safdarjung@demo.com",
                "emergency_services": True,
                "operating_hours": "24/7",
            },
            {
                "name": "Bahadurgarh PHC",
                "facility_type": "PHC",
                "address": "Main Road, Bahadurgarh, Haryana - 124507",
                "latitude": 28.6920,
                "longitude": 76.9350,
                "phone": "0126-2320100",
                "emergency_services": False,
                "operating_hours": "08:00-20:00",
            },
            {
                "name": "Faridabad Community Health Centre",
                "facility_type": "CHC",
                "address": "NIT Faridabad, Haryana - 121001",
                "latitude": 28.4089,
                "longitude": 77.3178,
                "phone": "0129-2412345",
                "emergency_services": True,
                "operating_hours": "24/7",
            },
            {
                "name": "Gurugram Civil Hospital",
                "facility_type": "Hospital",
                "address": "Civil Lines, Gurugram, Haryana - 122001",
                "latitude": 28.4595,
                "longitude": 77.0266,
                "phone": "0124-2324567",
                "email": "gurugram@demo.com",
                "emergency_services": True,
                "operating_hours": "24/7",
            },
        ]

        facility_objs = []
        for fd in facilities_data:
            f = Facility(**fd)
            facility_objs.append(f)
        session.add_all(facility_objs)
        await session.commit()
        for f in facility_objs:
            await session.refresh(f)

        f_aiims, f_safdarjung, f_phc, f_chc, f_gurugram = facility_objs

        # ============================================================
        # 4. DOCTORS (15 doctors across facilities)
        # ============================================================
        doctors_data = [
            # AIIMS Delhi (6 doctors)
            {"user": u_doctor, "facility": f_aiims, "spec": "General Medicine", "lic": "DMC-GM-001", "fee": 500, "exp": 15, "langs": "English,Hindi", "avail": True},
            {"user": doc_users[0], "facility": f_aiims, "spec": "Cardiology", "lic": "DMC-CD-001", "fee": 1500, "exp": 20, "langs": "English,Hindi,Tamil", "avail": True},
            {"user": doc_users[1], "facility": f_aiims, "spec": "Pulmonology", "lic": "DMC-PL-001", "fee": 1200, "exp": 12, "langs": "English,Hindi,Gujarati", "avail": True},
            {"user": doc_users[2], "facility": f_aiims, "spec": "Pediatrics", "lic": "DMC-PD-001", "fee": 800, "exp": 10, "langs": "English,Hindi,Malayalam", "avail": False},
            {"user": doc_users[3], "facility": f_aiims, "spec": "Orthopedics", "lic": "DMC-OR-001", "fee": 1000, "exp": 18, "langs": "English,Hindi", "avail": True},
            {"user": doc_users[4], "facility": f_aiims, "spec": "OB-GYN", "lic": "DMC-OG-001", "fee": 1000, "exp": 14, "langs": "English,Hindi,Telugu", "avail": True},
            # Safdarjung (3 doctors)
            {"user": doc_users[5], "facility": f_safdarjung, "spec": "General Medicine", "lic": "DMC-GM-002", "fee": 400, "exp": 8, "langs": "English,Hindi", "avail": True},
            {"user": doc_users[6], "facility": f_safdarjung, "spec": "Cardiology", "lic": "DMC-CD-002", "fee": 1200, "exp": 16, "langs": "English,Hindi", "avail": True},
            {"user": doc_users[7], "facility": f_safdarjung, "spec": "Emergency Medicine", "lic": "DMC-EM-001", "fee": 600, "exp": 10, "langs": "English,Hindi,Punjabi", "avail": True},
            # PHC Bahadurgarh (2 doctors)
            {"user": doc_users[8], "facility": f_phc, "spec": "General Medicine", "lic": "HMC-GM-001", "fee": 200, "exp": 5, "langs": "Hindi,English", "avail": True},
            {"user": doc_users[9], "facility": f_phc, "spec": "Pediatrics", "lic": "HMC-PD-001", "fee": 200, "exp": 7, "langs": "Hindi", "avail": False},
            # CHC Faridabad (2 doctors)
            {"user": doc_users[10], "facility": f_chc, "spec": "General Medicine", "lic": "HMC-GM-002", "fee": 300, "exp": 9, "langs": "Hindi,English", "avail": True},
            {"user": doc_users[11], "facility": f_chc, "spec": "OB-GYN", "lic": "HMC-OG-001", "fee": 500, "exp": 11, "langs": "Hindi", "avail": True},
            # Gurugram (2 doctors)
            {"user": doc_users[12], "facility": f_gurugram, "spec": "Pulmonology", "lic": "HMC-PL-001", "fee": 800, "exp": 13, "langs": "English,Hindi", "avail": True},
            {"user": doc_users[13], "facility": f_gurugram, "spec": "Dermatology", "lic": "HMC-DM-001", "fee": 700, "exp": 6, "langs": "English,Hindi,Punjabi", "avail": True},
        ]

        doctor_objs = []
        for dd in doctors_data:
            d = Doctor(
                user_id=dd["user"].id,
                facility_id=dd["facility"].id,
                full_name=dd["user"].full_name,
                specialization=dd["spec"],
                license_number=dd["lic"],
                consultation_fee=dd["fee"],
                experience_years=dd["exp"],
                languages=dd["langs"],
                is_available=dd["avail"]
            )
            doctor_objs.append(d)
        session.add_all(doctor_objs)
        await session.commit()
        for d in doctor_objs:
            await session.refresh(d)

        # ============================================================
        # 5. BEDS (50 beds across facilities)
        # ============================================================
        beds_data = []

        # AIIMS: 20 beds
        for i in range(1, 11):
            beds_data.append(Bed(facility_id=f_aiims.id, ward_name="General Ward A", bed_number=f"GWA-{i:02d}", bed_type="GENERAL", status="AVAILABLE" if i <= 5 else "OCCUPIED"))
        for i in range(1, 6):
            beds_data.append(Bed(facility_id=f_aiims.id, ward_name="ICU", bed_number=f"ICU-{i:02d}", bed_type="ICU", status="AVAILABLE" if i <= 2 else "OCCUPIED"))
        for i in range(1, 4):
            beds_data.append(Bed(facility_id=f_aiims.id, ward_name="Emergency", bed_number=f"ER-{i:02d}", bed_type="EMERGENCY", status="AVAILABLE"))
        for i in range(1, 3):
            beds_data.append(Bed(facility_id=f_aiims.id, ward_name="NICU", bed_number=f"NICU-{i:02d}", bed_type="NICU", status="AVAILABLE" if i == 1 else "OCCUPIED"))

        # Safdarjung: 15 beds
        for i in range(1, 9):
            beds_data.append(Bed(facility_id=f_safdarjung.id, ward_name="General Ward", bed_number=f"GW-{i:02d}", bed_type="GENERAL", status="AVAILABLE" if i <= 4 else "OCCUPIED"))
        for i in range(1, 5):
            beds_data.append(Bed(facility_id=f_safdarjung.id, ward_name="ICU", bed_number=f"ICU-{i:02d}", bed_type="ICU", status="AVAILABLE" if i <= 1 else "OCCUPIED"))
        for i in range(1, 4):
            beds_data.append(Bed(facility_id=f_safdarjung.id, ward_name="Emergency", bed_number=f"ER-{i:02d}", bed_type="EMERGENCY", status="AVAILABLE" if i <= 2 else "CLEANING"))

        # PHC Bahadurgarh: 5 beds
        for i in range(1, 6):
            beds_data.append(Bed(facility_id=f_phc.id, ward_name="General", bed_number=f"G-{i:02d}", bed_type="GENERAL", status="AVAILABLE" if i <= 3 else "OCCUPIED"))

        # CHC Faridabad: 6 beds
        for i in range(1, 5):
            beds_data.append(Bed(facility_id=f_chc.id, ward_name="General", bed_number=f"G-{i:02d}", bed_type="GENERAL", status="AVAILABLE" if i <= 2 else "OCCUPIED"))
        beds_data.append(Bed(facility_id=f_chc.id, ward_name="Emergency", bed_number="ER-01", bed_type="EMERGENCY", status="AVAILABLE"))
        beds_data.append(Bed(facility_id=f_chc.id, ward_name="Maternity", bed_number="MT-01", bed_type="GENERAL", status="AVAILABLE"))

        # Gurugram: 4 beds
        for i in range(1, 5):
            beds_data.append(Bed(facility_id=f_gurugram.id, ward_name="General Ward", bed_number=f"GW-{i:02d}", bed_type="GENERAL", status="AVAILABLE" if i <= 2 else "OCCUPIED"))

        session.add_all(beds_data)
        await session.commit()

        # ============================================================
        # 6. MEDICINES (30 essential medicines across facilities)
        # ============================================================
        medicine_catalog = [
            ("Paracetamol 500mg", "Acetaminophen", "Analgesic", True),
            ("Amoxicillin 500mg", "Amoxicillin", "Antibiotic", True),
            ("Metformin 500mg", "Metformin HCl", "Antidiabetic", True),
            ("Amlodipine 5mg", "Amlodipine Besylate", "Cardiac", True),
            ("Omeprazole 20mg", "Omeprazole", "Gastrointestinal", True),
            ("Cetirizine 10mg", "Cetirizine HCl", "Antihistamine", True),
            ("Salbutamol Inhaler", "Salbutamol", "Respiratory", True),
            ("ORS Packets", "Oral Rehydration Salts", "Rehydration", True),
            ("Ibuprofen 400mg", "Ibuprofen", "Analgesic", True),
            ("Azithromycin 500mg", "Azithromycin", "Antibiotic", True),
            ("Atorvastatin 10mg", "Atorvastatin", "Cardiac", False),
            ("Losartan 50mg", "Losartan Potassium", "Cardiac", True),
            ("Diclofenac Gel", "Diclofenac Diethylamine", "Analgesic", False),
            ("Ranitidine 150mg", "Ranitidine HCl", "Gastrointestinal", False),
            ("Doxycycline 100mg", "Doxycycline", "Antibiotic", False),
            ("Insulin Glargine", "Insulin Glargine", "Antidiabetic", True),
            ("Clopidogrel 75mg", "Clopidogrel", "Cardiac", True),
            ("Prednisolone 5mg", "Prednisolone", "Steroid", False),
            ("Montelukast 10mg", "Montelukast Sodium", "Respiratory", False),
            ("Iron + Folic Acid", "Ferrous Sulphate + Folic Acid", "Supplement", True),
            ("Vitamin D3 60000IU", "Cholecalciferol", "Supplement", False),
            ("Ciprofloxacin 500mg", "Ciprofloxacin", "Antibiotic", True),
            ("Ceftriaxone 1g Inj", "Ceftriaxone", "Antibiotic", True),
            ("Ondansetron 4mg", "Ondansetron", "Antiemetic", True),
            ("Atropine 0.6mg Inj", "Atropine Sulphate", "Emergency", True),
            ("Adrenaline 1mg Inj", "Epinephrine", "Emergency", True),
            ("Normal Saline 500ml", "Sodium Chloride 0.9%", "IV Fluid", True),
            ("Ringer Lactate 500ml", "Ringer Lactate", "IV Fluid", True),
            ("Povidone Iodine 5%", "Povidone Iodine", "Antiseptic", True),
            ("Chlorhexidine Mouthwash", "Chlorhexidine Gluconate", "Antiseptic", False),
        ]

        import random
        random.seed(42)  # Reproducible demo data

        for facility in facility_objs:
            # Each facility gets a subset of medicines with varied stock
            num_medicines = 25 if facility.facility_type == "Hospital" else 15
            selected = random.sample(medicine_catalog, min(num_medicines, len(medicine_catalog)))

            for med_name, generic, category, is_essential in selected:
                # Vary stock levels: some full, some low, some out
                roll = random.random()
                if roll < 0.15:
                    qty = 0  # Out of stock
                elif roll < 0.35:
                    qty = random.randint(1, 15)  # Low stock
                else:
                    qty = random.randint(50, 500)  # Normal stock

                session.add(MedicineInventory(
                    facility_id=facility.id,
                    medicine_name=med_name,
                    generic_name=generic,
                    category=category,
                    batch_number=f"BATCH-{random.randint(1000, 9999)}",
                    quantity_available=qty,
                    reorder_level=20,
                    expiry_date=date(2027, random.randint(1, 12), random.randint(1, 28)),
                    is_essential=is_essential
                ))

        await session.commit()

        # ============================================================
        # 7. SAMPLE TRIAGE SESSIONS
        # ============================================================
        ts1 = TriageSession(
            patient_id=p1.id, channel="WEB", language="en",
            raw_symptoms="I have had a persistent cough for 3 days with mild fever and body aches",
            urgency_level="ROUTINE", red_flags_detected=False,
            ai_response='{"urgency_level":"ROUTINE","primary_symptoms":["persistent cough","mild fever","body aches"],"red_flags_present":false,"potential_categories":["Respiratory","Infectious"],"recommended_specialty":"General Medicine","advisory_summary":"Symptoms may be consistent with a common upper respiratory infection. Duration of 3 days with mild fever suggests monitoring is appropriate.","next_steps":["Schedule a routine appointment with a General Physician","Monitor temperature - seek immediate care if fever exceeds 39°C","Stay hydrated and rest","Use OTC paracetamol for fever management"],"mandatory_disclaimer":"DISCLAIMER: This assessment is generated by an AI assistant for informational and triage routing purposes only. It is NOT a medical diagnosis. Please confirm with a qualified healthcare professional."}',
            recommended_specialty="General Medicine"
        )
        ts2 = TriageSession(
            patient_id=p2.id, channel="TELEGRAM", language="hi",
            raw_symptoms="Chest pain and difficulty breathing since morning",
            urgency_level="EMERGENCY", red_flags_detected=True,
            ai_response='{"urgency_level":"EMERGENCY","primary_symptoms":["chest pain","difficulty breathing"],"red_flags_present":true,"potential_categories":["Cardiac","Respiratory"],"recommended_specialty":"Emergency Medicine","advisory_summary":"Reported symptoms of chest pain combined with breathing difficulty require immediate medical evaluation. These symptoms could indicate a serious condition.","next_steps":["CALL 108 IMMEDIATELY","Go to the nearest emergency room","Do not drive yourself","Chew an aspirin if available and not allergic"],"mandatory_disclaimer":"DISCLAIMER: This assessment is generated by an AI assistant for informational and triage routing purposes only. It is NOT a medical diagnosis. Please confirm with a qualified healthcare professional."}',
            recommended_specialty="Emergency Medicine"
        )
        session.add_all([ts1, ts2])
        await session.commit()
        await session.refresh(ts1)

        # ============================================================
        # 8. SAMPLE APPOINTMENTS & QUEUE TOKENS
        # ============================================================
        now = datetime.now(timezone.utc)
        tomorrow_10am = now.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)

        apt1 = Appointment(
            patient_id=p1.id,
            doctor_id=doctor_objs[0].id,
            facility_id=f_aiims.id,
            triage_session_id=ts1.id,
            scheduled_start=tomorrow_10am,
            scheduled_end=tomorrow_10am + timedelta(minutes=30),
            status="SCHEDULED",
            consultation_type="IN_PERSON",
            chief_complaint="Persistent cough with mild fever"
        )
        apt2 = Appointment(
            patient_id=p2.id,
            doctor_id=doctor_objs[5].id,
            facility_id=f_safdarjung.id,
            scheduled_start=tomorrow_10am + timedelta(hours=1),
            scheduled_end=tomorrow_10am + timedelta(hours=1, minutes=30),
            status="SCHEDULED",
            consultation_type="VIDEO",
            chief_complaint="Follow-up for diabetes management"
        )
        session.add_all([apt1, apt2])
        await session.commit()
        await session.refresh(apt1)
        await session.refresh(apt2)

        qt1 = QueueToken(
            patient_id=p1.id,
            appointment_id=apt1.id,
            facility_id=f_aiims.id,
            doctor_id=doctor_objs[0].id,
            token_number="AIIMS-0902-001",
            position=1,
            status="WAITING",
            estimated_wait_minutes=15,
            checked_in=False
        )
        qt2 = QueueToken(
            patient_id=p2.id,
            appointment_id=apt2.id,
            facility_id=f_safdarjung.id,
            doctor_id=doctor_objs[5].id,
            token_number="SJH-0902-001",
            position=1,
            status="WAITING",
            estimated_wait_minutes=20,
            checked_in=False
        )
        session.add_all([qt1, qt2])
        await session.commit()

        print("=" * 60)
        print("  SeHAT Database Seeding Complete!")
        print("=" * 60)
        print(f"  Users:       {len(all_users)} (3 patients, 15 doctors, 1 admin)")
        print(f"  Patients:    3 profiles")
        print(f"  Facilities:  {len(facility_objs)}")
        print(f"  Doctors:     {len(doctor_objs)}")
        print(f"  Beds:        {len(beds_data)}")
        print(f"  Medicines:   ~{len(medicine_catalog) * len(facility_objs)} inventory entries")
        print(f"  Triage:      2 sample sessions")
        print(f"  Appointments: 2 with queue tokens")
        print("=" * 60)
        print("\n  Demo Credentials:")
        print("  Patient: patient@demo.com / demo1234")
        print("  Doctor:  doctor@demo.com / demo1234")
        print("  Admin:   admin@demo.com / demo1234")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed())

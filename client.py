import socket
import time
import random

def generate_patient_data(patient_id):
    return {
        'id': patient_id,
        'temperature': round(random.uniform(36.0, 38.5), 1),
        'heart_rate': random.randint(60, 100),
        'blood_pressure': f"{random.randint(90, 140)}/{random.randint(60, 90)}",
        'humidity': round(random.uniform(30, 70), 1),
        'oxygen': random.randint(95, 100)
    }

def send_data(sock, data):
    sock.sendall(str(data).encode())

def main():
    host = '127.0.0.1'
    port = 65432

    while True:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((host, port))
                print(f"Connected to server at {host}:{port}")
                while True:
                    for patient_id in range(1, 6):
                        data = generate_patient_data(patient_id)
                        send_data(s, data)
                        print(f"Sent data for patient {patient_id}: {data}")
                        time.sleep(1)
        except ConnectionRefusedError:
            print(f"Couldn't connect to server at {host}:{port}. Retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            print(f"An error occurred: {e}. Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    main()

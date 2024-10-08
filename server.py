import socket
import threading
import json
from queue import Queue
import time
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class Server:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.sock = None
        self.clients = []
        self.data_queue = Queue()
        self.patient_data = {}

    def start(self):
        retry_count = 0
        while retry_count < 5:
            try:
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.sock.bind((self.host, self.port))
                self.sock.listen()
                print(f"Server listening on {self.host}:{self.port}")
                threading.Thread(target=self.accept_connections, daemon=True).start()
                return True
            except OSError as e:
                print(f"Error starting server: {e}")
                retry_count += 1
                self.port += 1  # Try the next port
                time.sleep(1)
        print("Failed to start server after multiple attempts.")
        return False

    def accept_connections(self):
        while True:
            client_socket, addr = self.sock.accept()
            print(f"New connection from {addr}")
            self.clients.append(client_socket)
            threading.Thread(target=self.handle_client, args=(client_socket,), daemon=True).start()

    def handle_client(self, client_socket):
        while True:
            try:
                data = client_socket.recv(1024).decode()
                if not data:
                    break
                patient_data = eval(data)
                self.data_queue.put(patient_data)
                print(f"Received data: {patient_data}")
                self.patient_data[patient_data['id']] = patient_data  # Store patient data
            except Exception as e:
                print(f"Error handling client: {e}")
                break
        client_socket.close()
        self.clients.remove(client_socket)

    def get_latest_data(self):
        return list(self.patient_data.values())  # Return all patient data

@app.route('/data')
def get_data():
    return jsonify(server.get_latest_data())  # Return the latest patient data

def main():
    host = '127.0.0.1'
    port = 65432
    global server
    server = Server(host, port)
    if server.start():
        try:
            app.run(port=5000)  # Start Flask app
        except KeyboardInterrupt:
            print("Server shutting down.")
    else:
        print("Failed to start server. Exiting.")

if __name__ == "__main__":
    main()

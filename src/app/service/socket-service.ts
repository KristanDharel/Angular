import { Injectable } from '@angular/core';
import { Observable, Subject, ReplaySubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private connectionStatus = new ReplaySubject<boolean>(1);
  private connected = false;
  private connectionPromise: Promise<void> | null = null;
  private socketUrl = '';

  constructor() {}

  connect(url: string): Observable<boolean> {
    if (!this.socket || url !== this.socketUrl) {
      this.socketUrl = url;
      this.connectionPromise = new Promise<void>((resolve, reject) => {
        // Disconnect existing socket if any
        if (this.socket) {
          this.socket.disconnect();
        }

        this.socket = io(url, {
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ['websocket'],
          autoConnect: true,
        });

        const connectHandler = () => {
          this.connected = true;
          this.connectionStatus.next(true);
          console.log('Connected to socket server');
          resolve();
        };

        const disconnectHandler = () => {
          if (this.connected) {
            this.connected = false;
            this.connectionStatus.next(false);
            console.log('Disconnected from socket server');
          }
        };

        const errorHandler = (error: any) => {
          console.error('Connection error:', error);
          if (!this.connected) {
            reject(error);
          }
        };

        // Clean up previous listeners
        this.socket.off('connect', connectHandler);
        this.socket.off('disconnect', disconnectHandler);
        this.socket.off('connect_error', errorHandler);

        this.socket.on('connect', connectHandler);
        this.socket.on('disconnect', disconnectHandler);
        this.socket.on('connect_error', errorHandler);
      }).catch((error) => {
        console.error('Socket connection failed:', error);
        throw error;
      });
    }

    return this.connectionStatus.asObservable();
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connectionPromise) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    return this.connectionPromise;
  }

  // Fixed emit method - handles both callback and non-callback scenarios
  async emit(
    eventName: string,
    data: any,
    callback?: (response: any) => void
  ): Promise<void> {
    try {
      await this.ensureConnected();

      if (!this.connected || !this.socket) {
        throw new Error('Socket not connected');
      }

      return new Promise((resolve, reject) => {
        let timeoutId: any;
        let resolved = false;

        const safeResolve = () => {
          if (!resolved) {
            resolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            resolve();
          }
        };

        const safeReject = (error: Error) => {
          if (!resolved) {
            resolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            reject(error);
          }
        };

        // Set up timeout
        timeoutId = setTimeout(() => {
          console.warn(
            `Socket emit '${eventName}' timed out - this might be normal if server doesn't send callback`
          );
          safeResolve(); // Don't fail, just resolve
        }, 5000);

        if (callback) {
          this.socket.emit(eventName, data, (response: any) => {
            callback(response);
            safeResolve();
          });
        } else {
          this.socket.emit(eventName, data);
          safeResolve();
        }
      });
    } catch (error) {
      console.error(`Emit failed for ${eventName}:`, error);
      if (callback) {
        callback({
          success: false,
          message: 'Socket error: ' + (error as Error).message,
        });
      }
      throw error;
    }
  }

  // Alternative emit method for events that definitely expect a response
  async emitWithResponse<T = any>(
    eventName: string,
    data: any,
    timeoutMs: number = 5000
  ): Promise<T> {
    try {
      await this.ensureConnected();

      if (!this.connected || !this.socket) {
        throw new Error('Socket not connected');
      }

      return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(
            new Error(
              `Socket emit '${eventName}' timed out after ${timeoutMs}ms`
            )
          );
        }, timeoutMs);

        this.socket.emit(eventName, data, (response: T) => {
          clearTimeout(timeoutId);
          resolve(response);
        });
      });
    } catch (error) {
      console.error(`EmitWithResponse failed for ${eventName}:`, error);
      throw error;
    }
  }

  listen(eventName: string): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket not initialized');
        return;
      }

      const listener = (data: any) => {
        try {
          observer.next(data);
        } catch (error) {
          console.error('Error in socket listener:', error);
        }
      };

      this.socket.on(eventName, listener);

      return () => {
        if (this.socket) {
          this.socket.off(eventName, listener);
        }
      };
    });
  }

  // Updated join/leave methods
  async joinRoom(roomId: string): Promise<void> {
    try {
      console.log(`Attempting to join room: ${roomId}`);
      await this.emit('join_product', roomId);
      console.log(`Successfully joined room: ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  async leaveRoom(roomId: string): Promise<void> {
    try {
      if (this.connected && this.socket) {
        console.log(`Leaving room: ${roomId}`);
        await this.emit('leave_product', roomId);
        console.log(`Successfully left room: ${roomId}`);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      this.connectionStatus.next(false);
      this.connectionPromise = null;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras import models, layers, callbacks


class GoldModel:
    
    def __init__(self, ticker='GC=F', start_date='2013-01-01', time_steps=60):
        self.ticker = ticker
        self.start_date = start_date
        self.time_steps = time_steps
        self.model = None
        self.scaler = None
        self.data = None
        self.last_prices = None 
        
    def download_data(self):
        try:
            self.data = yf.download(self.ticker, start=self.start_date, progress=False)
        except Exception as e:
            raise Exception(f"Error downloading data for {self.ticker}: {e}")
        
        if isinstance(self.data.columns, pd.MultiIndex):
            self.data.columns = self.data.columns.get_level_values(0)
        
        self.data.reset_index(inplace=True)
        
        if 'Date' in self.data.columns:
            self.data['Date'] = pd.to_datetime(self.data['Date'])
            self.data = self.data.set_index('Date')
        elif 'Datetime' in self.data.columns:
            self.data['Datetime'] = pd.to_datetime(self.data['Datetime'])
            self.data = self.data.set_index('Datetime')
        
        if 'Close' in self.data.columns:
            self.data.rename(columns={'Close': 'Price'}, inplace=True)
        elif 'Adj Close' in self.data.columns:
            self.data.rename(columns={'Adj Close': 'Price'}, inplace=True)
        else:
            raise ValueError("Could not find 'Close' or 'Adj Close' column in data")
        
        self.data.dropna(subset=['Price'], inplace=True)
        
        return self.data
    
    def prepare_data(self, train_test_split=0.8):
        features = self.data['Price'].values.reshape(-1, 1)
        
        train_size = int(len(features) * train_test_split)
        test_size = len(features) - train_size
        
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = self.scaler.fit_transform(features)
        
        training = scaled_data[:train_size]
        x_train, y_train = [], []
        
        for i in range(self.time_steps, len(training)):
            x_train.append(training[i - self.time_steps:i, 0])
            y_train.append(training[i, 0])
        
        x_train = np.array(x_train)
        y_train = np.array(y_train)
        x_train = np.reshape(x_train, (x_train.shape[0], x_train.shape[1], 1))
        
        test_features = scaled_data[train_size - self.time_steps:]
        x_test, y_test = [], []
        
        for i in range(self.time_steps, len(test_features)):
            x_test.append(test_features[i - self.time_steps:i, 0])
            y_test.append(test_features[i, 0])
        
        x_test = np.array(x_test)
        x_test = x_test.reshape(x_test.shape[0], x_test.shape[1], 1)
        y_test = np.array(y_test)
        
        self.last_prices = scaled_data[-self.time_steps:].flatten()
        
        return x_train, y_train, x_test, y_test
    
    def build_model(self):
        self.model = models.Sequential([
            layers.LSTM(50, return_sequences=True, input_shape=(self.time_steps, 1)),
            layers.Dropout(0.2),
            layers.LSTM(50, return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(50, return_sequences=False),
            layers.Dropout(0.2),
            layers.Dense(25, activation='relu'),
            layers.Dense(1, activation='linear')
        ])
        
        optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
        self.model.compile(optimizer=optimizer, loss='mse', metrics=['mean_absolute_error'])
        
        return self.model
    
    def train(self, x_train, y_train, epochs=50, batch_size=32):
        if self.model is None:
            self.build_model()
        
        history = self.model.fit(
            x_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            verbose=1,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(
                    monitor='loss',
                    patience=10,
                    restore_best_weights=True
                )
            ]
        )
        
        return history
    
    def evaluate(self, x_test, y_test):
        predictions = self.model.predict(x_test)
        predictions_real = self.scaler.inverse_transform(predictions)
        y_test_real = self.scaler.inverse_transform(y_test.reshape(-1, 1))
        
        rmse = np.sqrt(np.mean((y_test_real - predictions_real) ** 2))
        mape = np.mean(np.abs((y_test_real - predictions_real) / y_test_real)) * 100
        accuracy = 100 - mape
        
        return {
            'rmse': rmse,
            'mape': mape,
            'accuracy': accuracy,
            'predictions': predictions_real.flatten(),
            'actual': y_test_real.flatten()
        }
    
    def predict(self, price_value):

        if self.model is None or self.scaler is None or self.last_prices is None:
            raise Exception("Model not trained. Please train the model first.")
        
        # Normalize the input value
        normalized_value = self.scaler.transform([[price_value]])[0, 0]
        
        input_seq = np.append(self.last_prices[1:], normalized_value)
        input_seq = input_seq.reshape(1, self.time_steps, 1)
        
        prediction = self.model.predict(input_seq, verbose=0)
        
        predicted_value = self.scaler.inverse_transform(prediction)[0, 0]
        
        self.last_prices = np.append(self.last_prices[1:], normalized_value)
        
        return float(predicted_value)

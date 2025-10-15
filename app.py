from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def start():
    return render_template('index.html')
@app.route('/home')
def home():
    return render_template('home.html')
@app.route('/auth')
def auth():
    return render_template('auth.html')


if __name__ == 'main':
    app.run(Debug==True)
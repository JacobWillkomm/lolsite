"""
Django settings for lolsite project.

Generated by 'django-admin startproject' using Django 2.1.5.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.1/ref/settings/
"""

import os
import urllib.parse

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# try to get environment variables from AWS env bash script
try:
    with open(os.path.join(os.path.dirname(BASE_DIR), 'env'), 'rb') as env_file:
        for line in env_file:
            line = line.strip()
            if line == '':
                continue
            line = line.split('export ')[1]
            key = line.split('=')[0]
            value = ''.join(line.split('=')[1:]).strip('"')
            os.environ[key] = value
except:
    print('Unable to set environment variables through env bash script')

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '6cs%&oj!lvxpvj44r63-#ie=-%er1hs@%sbt1k9=lf7-b_mlxv'

# SECURITY WARNING: don't run with debug turned on in production!
env = os.environ

ENVNAME = os.environ.get('ENVNAME', None)

REACT_DEV = False
if env.get('LOLSITE_HOST', None) == 'dev':
    DEV = True
    DEBUG = True
else:
    DEV = False
    DEBUG = False


if DEV:
    ALLOWED_HOSTS = ['localhost', '192.168.0.24']
else:
    ALLOWED_HOSTS = ['.elasticbeanstalk.com']

GIT_BUILD = 0
try:
    with open(os.path.join(BASE_DIR, '.git', 'logs', 'HEAD')) as git_log:
        line = [line for line in git_log][-1]
        GIT_BUILD = line.split()[1][:7]
except:
    pass

VERSION = [0, 0, 1, GIT_BUILD]
VERSION_STRING = '.'.join(list(map(str, VERSION)))

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'lolsite',
    'data',
    'match',
    'player',
    'fun',
    'pro',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'lolsite.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'lolsite.context_processors.react_data_processor',
                'lolsite.context_processors.version_processor',
            ],
        },
    },
]

WSGI_APPLICATION = 'lolsite.wsgi.application'


# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases

if DEV:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env.get('LOLSITE_DB_NAME'),
            'USER': env.get('LOLSITE_DB_USER'),
            'HOST': env.get('LOLSITE_DB_HOST'),
            'PORT': env.get('LOLSITE_DB_PORT'),
            'PASSWORD': env.get('LOLSITE_DB_PASS'),
        }
    }
else:
    if ENVNAME in ['lolsite']:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': os.environ['LOLSITE_DB_NAME'],
                'USER': os.environ['LOLSITE_DB_USER'],
                'PASSWORD': os.environ['LOLSITE_DB_PASS'],
                'HOST': os.environ['LOLSITE_DB_HOST'],
                'PORT': os.environ['LOLSITE_DB_PORT'],
            }
        }

# Password validation
# https://docs.djangoproject.com/en/2.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/2.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# aws access keys
AWS_ACCESS_KEY_ID = 'AKIAJADAEJNHT3SNA6XA'
AWS_SECRET_ACCESS_KEY = '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'


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.1/howto/static-files/

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "lolsite/static"),
    os.path.join(BASE_DIR, 'react/src/static'),
    os.path.join(BASE_DIR, 'react/build/static'),
]

# CELERY SETTINGS
if 'RDS_DB_NAME' in os.environ or ENVNAME in ['lolsite', 'lolsite-beat']:
    BROKER_TRANSPORT_OPTIONS = {
        'region': 'us-west-2'
    }
    BROKER_URL = 'sqs://{}:{}@'.format(urllib.parse.quote(AWS_ACCESS_KEY_ID, safe=''), urllib.parse.quote(AWS_SECRET_ACCESS_KEY, safe=''))
else:
    CELERY_BROKER_URL = 'redis://localhost'

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
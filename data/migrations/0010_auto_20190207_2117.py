# Generated by Django 2.1.5 on 2019-02-07 21:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0009_auto_20190207_2115'),
    ]

    operations = [
        migrations.AlterField(
            model_name='champion',
            name='_id',
            field=models.CharField(blank=True, db_index=True, default='', max_length=128),
        ),
    ]

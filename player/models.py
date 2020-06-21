"""player/models.py

Model definitions for the player app.

"""
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import models
from django.utils import timezone

from data import constants as dc


def simplify(name):
    """Return the lowercase, no space version of a string.

    Parameters
    ----------
    name : str

    Returns
    -------
    str

    """
    return "".join(name.split()).lower()


def validate_password(password):
    """Validate a password.

    Parameters
    ----------
    password: str

    Returns
    -------
    tuple(password[str], is_valid[bool], validation[dict])

    """
    MIN_LEN = dc.MIN_PASSWORD_LENGTH
    validation = {}
    password = password.strip()
    if len(password) < MIN_LEN:
        validation["length"] = f"Your password must be at least {MIN_LEN} characters."

    if len(list(validation.keys())) == 0:
        is_valid = True
    else:
        is_valid = False

    return (password, is_valid, validation)


class Summoner(models.Model):
    user = models.ForeignKey(
        User,
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        blank=True,
        related_name="summoners",
    )
    _id = models.CharField(
        max_length=128, default="", blank=True, unique=True, db_index=True
    )
    region = models.CharField(max_length=8, default="", blank=True, db_index=True)
    account_id = models.CharField(
        max_length=128, default="", blank=True, null=True, db_index=True
    )
    name = models.CharField(max_length=32, default="", blank=True)
    simple_name = models.CharField(max_length=32, default="", blank=True, db_index=True)
    profile_icon_id = models.IntegerField(default=0)
    puuid = models.CharField(max_length=256, default="", blank=True)
    revision_date = models.BigIntegerField(default=0)
    summoner_level = models.IntegerField(default=0)
    pro = models.ForeignKey("Pro", null=True, on_delete=models.SET_NULL, blank=True)

    # number of games imported when last match history import was run.
    full_import_count = models.IntegerField(default=0, blank=True)
    ranked_import_count = models.IntegerField(default=0, blank=True)

    last_summoner_page_import = models.DateTimeField(null=True)
    created_date = models.DateTimeField(default=timezone.now, db_index=True)

    __original_account_id = None
    __original_name = None

    class Meta:
        unique_together = ("region", "account_id", "_id")

    def __init__(self, *args, **kwargs):
        super(Summoner, self).__init__(*args, **kwargs)
        self.__original_account_id = self.account_id
        self.__original_name = self.name

    def __str__(self):
        return f'Summoner(name="{self.name}", region={self.region})'

    def save(self, *args, **kwargs):
        if self.name:
            self.simple_name = simplify(self.name)

        if self.name != self.__original_name and self.__original_name is not None:
            namechange = NameChange(summoner=self, old_name=self.__original_name)
            namechange.save()

        super(Summoner, self).save(*args, **kwargs)
        self.__original_name = self.name
        self.__original_account_id = self.account_id

    def get_newest_rank_checkpoint(self):
        """Retrieve the most recent checkpoint for the summoner.

        Returns
        -------
        RankCheckpoint or None

        """
        try:
            checkpoint = self.rankcheckpoints.all().order_by("-created_date")[0]
        except:
            checkpoint = None
        return checkpoint


class Pro(models.Model):
    position_choices = (
        ("top", "top"),
        ("jg", "jg"),
        ("mid", "mid"),
        ("adc", "adc"),
        ("sup", "sup"),
    )
    ign = models.CharField(
        max_length=256, db_index=True, default="", blank=True, unique=True
    )
    position = models.CharField(
        choices=position_choices, max_length=8, db_index=True, blank=True, default=""
    )

    def __str__(self):
        return (
            f'Pro(ign={self.ign}, position={self.position if self.position else "NA"})'
        )


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    summoner = models.ForeignKey("Summoner", on_delete=models.CASCADE)
    sort_int = models.IntegerField(null=True, default=None)

    def __str__(self):
        return f'Favorite(user="{self.user.username}")'

    def save(self, *args, **kwargs):
        # set sort_int if it hasn't yet.
        if self.sort_int is None:
            count = Favorite.objects.filter(user=self.user).count()
            self.sort_int = count
        super(Favorite, self).save(*args, **kwargs)

    def name(self):
        return self.summoner.name if self.summoner else ""

    def region(self):
        return self.summoner.region if self.summoner else ""


class NameChange(models.Model):
    summoner = models.ForeignKey(
        "Summoner", on_delete=models.CASCADE, related_name="namechanges"
    )
    old_name = models.CharField(max_length=128, default="")
    created_date = models.DateTimeField(default=timezone.now, db_index=True)

    def __str__(self):
        return (
            f'NameChange(old_name="{self.old_name}", new_name="{self.summoner.name}")'
        )


class RankCheckpoint(models.Model):
    summoner = models.ForeignKey(
        "Summoner", on_delete=models.CASCADE, related_name="rankcheckpoints"
    )
    created_date = models.DateTimeField(default=timezone.now, db_index=True)


class RankPosition(models.Model):
    checkpoint = models.ForeignKey(
        "RankCheckpoint", on_delete=models.CASCADE, related_name="positions"
    )

    fresh_blood = models.BooleanField(default=False, blank=True)
    hot_streak = models.BooleanField(default=False, blank=True)
    inactive = models.BooleanField(default=False, blank=True)
    veteran = models.BooleanField(default=False, blank=True)
    league_points = models.IntegerField(default=0, null=True, blank=True)
    wins = models.IntegerField(default=0, blank=True)
    losses = models.IntegerField(default=0, blank=True)
    series_progress = models.CharField(
        max_length=16, default=None, null=True, blank=True
    )
    position = models.CharField(max_length=32, default="NONE", null=True, blank=True)
    queue_type = models.CharField(max_length=32, default="", blank=True)
    rank = models.CharField(max_length=32, default="", blank=True)
    tier = models.CharField(max_length=32, default="", blank=True)
    rank_integer = models.IntegerField(default=0, db_index=True)

    def save(self, *args, **kwargs):
        if self.rank_integer == 0:
            self.rank_integer = self.encode()
        super(RankPosition, self).save(*args, **kwargs)

    def encode(self):
        """Encode tier, rank, league_points to an integer.

        Returns
        -------
        int

        """
        return encode_rank_to_int(self.tier, self.rank, self.league_points)

    def decode(self):
        """Decodes rank_integer back into the tier, division, and league_points

        Returns
        -------
        dict

        """
        return decode_int_to_rank(self.rank_integer)


def encode_rank_to_int(tier, division, lp):
    ranks = dc.RANKS[9]
    tier_index = ranks["TIERS"].index(tier.lower())
    division_index = (
        len(ranks["DIVISIONS"]) - 1 - ranks["DIVISIONS"].index(division.upper())
    )
    rank_integer = int(f"{tier_index:02}{division_index:02}{lp:04}")
    return rank_integer


def decode_int_to_rank(rank_integer):
    ranks = dc.RANKS[9]
    lp = rank_integer % 10_000
    rest = rank_integer // 10_000
    division_index = len(ranks["DIVISIONS"]) - 1 - rest % 100
    tier_index = rank_integer // 1_000_000
    data = {
        "tier": ranks["TIERS"][tier_index],
        "division": ranks["DIVISIONS"][division_index],
        "league_points": lp,
    }
    return data


class Custom(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20, default=None, null=True, blank=True)
    is_email_verified = models.BooleanField(default=False, db_index=True, blank=True)

    created_date = models.DateTimeField(default=timezone.now, db_index=True, blank=True)
    modified_date = models.DateTimeField(default=timezone.now, blank=True)

    def save(self, *args, **kwargs):
        # Always set modified_date on save().
        self.modified_date = timezone.now()
        super(Custom, self).save(*args, **kwargs)


class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.UUIDField(default=uuid.uuid4, blank=True, db_index=True)
    created_date = models.DateTimeField(default=timezone.now, db_index=True, blank=True)

    def save(self, *args, **kwargs):
        # send verification email for new EmailVerification models.
        if self.pk is None:
            self.send_verification_email()
        super(EmailVerification, self).save(*args, **kwargs)

    def get_verification_url(self):
        return f"{settings.BASE_URL}/verify/?code={self.code.hex}"

    def send_verification_email(self):
        subject = "Verify Email"
        message = f"""
            Hi there, you sign up for an account on our league site.  Please go to the following
            url to verify your account.

            {self.get_verification_url()}

            If you did not sign up for an account, please ignore this email.

            If you do not verify your email within 24 hours, your account will be deleted.
        """
        html_message = f"""
            <div>
                Hi there, you signed up for an account on our league site at
                {self.user.date_joined}.  Please click the link below to verify this email.
            </div>
            <br>
            <div>
                <a href='{self.get_verification_url()}' >{self.get_verification_url()}</a>
            </div>
            <br>
            <div>
                If you did not sign up for an account, please ignore this email.
                If you do not verify your email, your account will be deleted.
            </div>
        """
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [self.user.email],
            html_message=html_message,
        )


class SummonerLink(models.Model):
    uuid = models.CharField(max_length=128, default="", db_index=True)
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    summoner = models.ForeignKey("Summoner", null=True, on_delete=models.CASCADE)
    verified = models.BooleanField(default=False, db_index=True)

    created_date = models.DateTimeField(default=timezone.now, db_index=True, blank=True)
    modified_date = models.DateTimeField(default=timezone.now, blank=True)

    def save(self, *args, **kwargs):
        # Set new uuid if one isn't set.
        if self.uuid == "":
            self.uuid = uuid.uuid4().hex[-6:]
        # Always set modified_date on save().
        self.modified_date = timezone.now()
        super(SummonerLink, self).save(*args, **kwargs)

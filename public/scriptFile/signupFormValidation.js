



const nameid = document.getElementById("name");
    const emailid = document.getElementById("email");
    const phoneid = document.getElementById("phone");
    const passid = document.getElementById("password");
    const cpassid = document.getElementById("confirm-password");

    const error1 = document.getElementById("error1");
    const error2 = document.getElementById("error2");
    const error3 = document.getElementById("error3");
    const error4 = document.getElementById("error4");
    const error5 = document.getElementById("error5");

    const signform = document.getElementById("signform");

    //---------------------------------------------
    function nameValidateChecking() {
      const nameval = nameid.value;
      const namepattern  = /^[A-Za-z\s]{3,}$/;

      //trim method is used to remove empty space in starting and ending 
      if (nameval.trim() === "" || nameval.length<3) {
          error1.style.display = "block";
          error1.innerHTML = "Please enter a valid username (min 3 characters)";
      } else if (!namepattern.test(nameval)) {
          error1.style.display = "block";
          error1.innerHTML = "Name can only contain alphabets and spaces";
      } else {
           error1.style.display = "none";
           error1.innerHTML = "";
      }
    }

    //---------------------------------------------

    function emailValidateChecking() {
      const emailval = emailid.value;

    //   const emailpattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
         const emailpattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

      if (!emailpattern.test(emailval)) {
        error2.style.display = "block";
        error2.innerHTML = "Please enter a valid email";
      } else {
        error2.style.display = "none";
        error2.innerHTML = "";
      }
    }

    //------------------------------------------------------

    function phoneValidateChecking() {
      const phoneval = phoneid.value;

      if (phoneval.trim() === "") {
        error3.style.display = "block";
        error3.innerHTML = "Please enter a valid phone number";
      } else if (phoneval.length !== 10) {
        error3.style.display = "block";
        error3.innerHTML = "Please enter a valid 10 digit phone number";
      } else {
        error3.style.display = "none";
        error3.innerHTML = "";
      }
    }

    //---------------------------------------------------

    function passValidateChecking() {
      const passval = passid.value;
      const cpassval = cpassid.value;

    //   const alpha = /[a-zA-Z]/;
    //   const digit = /\d/;

        const passPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // At least 8 characters, one uppercase, one lowercase, one number, one special character


      if (passval.length < 8) {
        error4.style.display = "block";
        error4.innerHTML = "Password must be at least 8 characters long";
      }else if(!passPattern.test(passval)){

            error4.style.display = "block"
            error4.innerHTML = "Password must include uppercase, lowercase, number, and special character"
      } else {
        error4.style.display = "none";
        error4.innerHTML = "";
      }

      if (passval !== cpassval) {
        error5.style.display = "block";
        error5.innerHTML = "Passwords do not match";
      } else {
        error5.style.display = "none";
        error5.innerHTML = "";
      }
    }

    //---------------------------------------------
    document.addEventListener("DOMContentLoaded", function() {
      signform.addEventListener("submit", function(e) {
        nameValidateChecking();
        emailValidateChecking();
        phoneValidateChecking();
        passValidateChecking();

        if (
          error1.innerHTML !== "" ||
          error2.innerHTML !== "" ||
          error3.innerHTML !== "" ||
          error4.innerHTML !== "" ||
          error5.innerHTML !== ""
        ) {
          e.preventDefault();
        }
      });
    });